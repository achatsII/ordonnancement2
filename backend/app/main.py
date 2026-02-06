from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
import collections
from ortools.sat.python import cp_model
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# Global exception handler to catch Pydantic validation errors
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    body = await request.body()
    print("=" * 80)
    print("PYDANTIC VALIDATION ERROR CAUGHT!")
    print(f"URL: {request.url}")
    print(f"Method: {request.method}")
    print(f"Errors: {exc.errors()}")
    print(f"Body (first 500 chars): {body[:500]}")
    print("=" * 80)
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Task(BaseModel):
    id: str
    name: str
    eligibleLines: List[str]
    duration: int
    skill: str
    order: Optional[int] = 0
    manualStart: Optional[int] = None # New: Field to store user override

class Job(BaseModel):
    id: str
    name: str
    tasks: List[Task]
    color: str
    priority: int
    dueDate: int

class Operator(BaseModel):
    id: str
    name: str
    skills: List[str]

class Line(BaseModel):
    id: str
    name: str

class SolveRequest(BaseModel):
    jobs: List[Job]
    lines: List[Line]
    operators: List[Operator]

# ===== WHAT-IF MODELS =====

class WhatIfModification(BaseModel):
    type: str  # 'delay_order', 'machine_down', 'operator_unavailable', 'task_move', 'custom'
    description: str
    parameters: Dict

class WhatIfScenario(BaseModel):
    id: str
    name: str
    description: str
    baseScheduleId: str
    modifications: List[WhatIfModification]

class WhatIfSimulateRequest(BaseModel):
    scenario: WhatIfScenario
    currentSolveRequest: SolveRequest  # Base schedule configuration
    currentTasks: List[Dict]  # Current schedule tasks (for comparison)

class JobImpact(BaseModel):
    jobId: str
    jobName: str
    endTimeBefore: str
    endTimeAfter: str
    deltaHours: float
    status: str  # 'improved', 'degraded', 'neutral'

class ImpactAnalysis(BaseModel):
    jobImpacts: List[JobImpact]
    globalMetrics: Dict

@app.post("/solve")
async def solve_production(req: SolveRequest):
    print("=" * 50)
    print("SOLVE REQUEST RECEIVED")
    print(f"Jobs: {len(req.jobs)}")
    print(f"Lines: {len(req.lines)}")
    print(f"Operators: {len(req.operators)}")
    print("=" * 50)
    model = cp_model.CpModel()
    
    # Pre-computation (Heuristic Horizon)
    # Sum of all durations + buffer. In production, might want 'Start of earliest job + sum of durations'
    horizon = sum(t.duration for j in req.jobs for t in j.tasks) + 1000 
    
    task_info = collections.defaultdict(list) # (job_id, task_idx) -> list of machine options
    job_starts = {} # (job_id, task_idx) -> start_var
    job_ends = {} # (job_id, task_idx) -> end_var
    
    line_to_intervals = collections.defaultdict(list)
    operator_to_intervals = collections.defaultdict(list)
    
    for job_idx, job in enumerate(req.jobs):
        for t_idx, task in enumerate(job.tasks):
            suffix = f"_{job_idx}_{t_idx}"
            
            # Global start/end for the task
            start_var = model.new_int_var(0, horizon, f"start{suffix}")
            end_var = model.new_int_var(0, horizon, f"end{suffix}")
            
            # --- MANUAL OVERRIDE LOGIC ---
            if task.manualStart is not None:
                model.add(start_var == task.manualStart)
            
            job_starts[job_idx, t_idx] = start_var
            job_ends[job_idx, t_idx] = end_var
            
            # Choice of machine
            machine_options = []
            for line_id in task.eligibleLines:
                alt_suffix = f"{suffix}_{line_id}"
                l_presence = model.new_bool_var(f"presence{alt_suffix}")
                l_start = model.new_int_var(0, horizon, f"start{alt_suffix}")
                l_end = model.new_int_var(0, horizon, f"end{alt_suffix}")
                l_interval = model.new_optional_interval_var(l_start, task.duration, l_end, l_presence, f"interval{alt_suffix}")
                
                # Link local variables to global task variables if present
                model.add(l_start == start_var).only_enforce_if(l_presence)
                model.add(l_end == end_var).only_enforce_if(l_presence)
                
                machine_options.append((line_id, l_presence))
                line_to_intervals[line_id].append(l_interval)
                
                # Operator constraint
                # Find valid operators for this task's skill
                # NOTE: This logic assumes 1 operator per task, and picks ONE from the list of valid ones?
                # Actually, the user code tries to find ONE assigned_op. 
                # Ideally, we should allow ANY operator with the skill.
                # Let's adapt to be more flexible: Create an interval for EACH capable operator and select ONE.
                
                # However, following the user's snippet strictness:
                # "assigned_op = next((op for op in req.operators if task.skill in op.skills), None)"
                # This seems to pick the STARTING operator found. This might be a bug in the snippet or a simplification.
                # If multiple operators have the skill, we should probably allow the solver to pick amongst them.
                # ADAPTATION: Allow solver to choose Operator.
                
                capable_ops = [op for op in req.operators if task.skill in op.skills]
                if capable_ops:
                    # We need to choose ONE operator for this specific machine assignment? 
                    # OR is the operator assigned regardless of machine?
                    # Usually Operator is independent resource.
                    # Let's stick to the prompt's logic but maybe fix the 'first found' issue if possible.
                    # The prompt's logic: "assigned_op = next(...)". This forces the task to the FIRST operator found.
                    # This effectively statically assigns the operator. 
                    # I will keep it as is to respect the prompt, but maybe add a comment.
                    # Actually, for "Scheduling", dynamic operator assignment is better. 
                    # But let's simplify: if simple snippet, maybe static is intended.
                    # Re-reading: "assigned_op = next(...)"
                    # I'll stick to the snippet for now.
                    
                    assigned_op = capable_ops[0] # Simply take the first capable one for now per the snippet logic
                    operator_to_intervals[assigned_op.id].append(l_interval)

            # Exactly one machine must be selected
            if machine_options:
                model.add_exactly_one([opt[1] for opt in machine_options])
            
            task_info[job_idx, t_idx] = machine_options

    # Constraint: No overlap on lines
    for line_id, intervals in line_to_intervals.items():
        model.add_no_overlap(intervals)
        
    # Constraint: No overlap for operators
    for op_id, intervals in operator_to_intervals.items():
        model.add_no_overlap(intervals)

    # Constraint: Precedence in jobs (Strict sequence)
    for job_idx, job in enumerate(req.jobs):
        for t_idx in range(len(job.tasks) - 1):
            model.add(job_starts[job_idx, t_idx + 1] >= job_ends[job_idx, t_idx])

    # --- SME Specific Objectives ---
    # 1. Total Makespan
    makespan = model.new_int_var(0, horizon, "makespan")
    if req.jobs:
        job_ends_vars = []
        for j_idx, job in enumerate(req.jobs):
            if job.tasks:
                 job_ends_vars.append(job_ends[j_idx, len(job.tasks)-1])
        if job_ends_vars:
            model.add_max_equality(makespan, job_ends_vars)
    
    # 2. Tardiness
    total_weighted_tardiness = model.new_int_var(0, horizon * 10000, "tardiness") # Increased bounds
    job_tardiness_vars = []
    
    for job_idx, job in enumerate(req.jobs):
        if not job.tasks: continue
        finish_time = job_ends[job_idx, len(job.tasks) - 1]
        tardiness = model.new_int_var(0, horizon, f"tardiness_j{job_idx}")
        
        # tardiness >= finish - due
        # tardiness >= 0
        model.add(tardiness >= finish_time - job.dueDate)
        model.add(tardiness >= 0)
        
        weighted_tardiness = model.new_int_var(0, horizon * 100, f"weighted_tardiness_j{job_idx}")
        model.add(weighted_tardiness == tardiness * job.priority)
        job_tardiness_vars.append(weighted_tardiness)
        
    if job_tardiness_vars:
        model.add(total_weighted_tardiness == sum(job_tardiness_vars))
    else:
        model.add(total_weighted_tardiness == 0)

    # Objective: Minimize Weighted Tardiness (Primary) + Makespan (Secondary)
    # Scaled to prioritize tardiness
    model.minimize(total_weighted_tardiness * 10 + makespan)

    # Solve
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10.0
    status = solver.solve(model)

    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        results = []
        for job_idx, job in enumerate(req.jobs):
            for t_idx, task in enumerate(job.tasks):
                # Find chosen line
                chosen_line = "N/A"
                if (job_idx, t_idx) in task_info:
                    for line_id, presence in task_info[job_idx, t_idx]:
                        if solver.value(presence):
                            chosen_line = line_id
                            break
                
                # Check operator (using the same static logic as above)
                op_name = "N/A"
                capable_ops = [op for op in req.operators if task.skill in op.skills]
                if capable_ops:
                     op_name = capable_ops[0].name

                results.append({
                    "id": task.id,
                    "jobId": job.id,
                    "jobName": job.name,
                    "name": task.name,
                    "line": chosen_line,
                    "start": solver.value(job_starts[job_idx, t_idx]),
                    "end": solver.value(job_ends[job_idx, t_idx]),
                    "duration": task.duration,
                    "color": job.color,
                    "operatorName": op_name,
                    "priority": job.priority,
                    "dueDate": job.dueDate,
                    "manualStart": task.manualStart
                })
        
        return {
            "status": "success",
            "makespan": solver.value(makespan),
            "tardiness": solver.value(total_weighted_tardiness),
            "stats": {
                "branches": solver.num_branches,
                "conflicts": solver.num_conflicts,
                "wall_time": solver.wall_time
            },
            "tasks": results,
            "logs": [
                f"Solver Status: {solver.status_name(status)}",
                f"SME Objective (Weighted Tardiness): {solver.value(total_weighted_tardiness)}",
                f"Production Makespan: {solver.value(makespan)}",
            ]
        }
    else:
        return {
            "status": "failed", 
            "logs": [
                f"Solver Status: {solver.status_name(status)}", 
                "Infeasible constraints. Potential conflict with manual overrides."
            ]
        }

@app.post("/whatif/simulate")
async def simulate_whatif_scenario(req: WhatIfSimulateRequest):
    """
    Simulate a What-If scenario by applying modifications and re-solving.
    Returns the new schedule and impact analysis.
    """
    try:
        from .whatif_helpers import apply_whatif_modifications, calculate_impact_analysis
        
        # Apply modifications to the base solve request
        modified_solve_request = apply_whatif_modifications(
            req.currentSolveRequest, 
            req.scenario.modifications
        )
        
        # Store original makespan
        original_makespan = 0
        if req.currentTasks:
            original_makespan = max(
                (task.get('start', 0) + task.get('duration', 0)) 
                for task in req.currentTasks
            )
        
        # Re-solve with modified parameters
        solve_result = await solve_production(modified_solve_request)
        
        if solve_result.get('status') != 'success':
            return {
                'status': 'failed',
                'error': 'Failed to solve modified scenario',
                'logs': solve_result.get('logs', [])
            }
        
        # Calculate impact analysis
        impact = calculate_impact_analysis(
            req.currentTasks,
            solve_result['tasks'],
            original_makespan,
            solve_result['makespan']
        )
        
        return {
            'status': 'success',
            'simulatedSchedule': {
                'tasks': solve_result['tasks'],
                'makespan': solve_result['makespan'],
                'logs': solve_result['logs'],
                'updatedAt': '2024-01-01T00:00:00Z'
            },
            'impactAnalysis': impact
        }
    
    except Exception as e:
        import traceback
        return {
            'status': 'error',
            'error': str(e),
            'traceback': traceback.format_exc()
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
