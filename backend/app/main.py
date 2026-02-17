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

from .models import (
    Task, Job, Operator, Line, SetupTime, AvailabilityInterval, 
    ResourceAvailability, SolveRequest, WhatIfModification, 
    WhatIfScenario, WhatIfSimulateRequest, JobImpact, ImpactAnalysis
)

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
            
            # --- MACHINE ASSIGNMENT ---
            machine_options = []
            for line_id in task.eligibleLines:
                alt_suffix = f"{suffix}_{line_id}"
                l_presence = model.new_bool_var(f"presence_line{alt_suffix}")
                l_interval = model.new_optional_interval_var(start_var, task.duration, end_var, l_presence, f"interval_line{alt_suffix}")
                
                machine_options.append((line_id, l_presence))
                line_to_intervals[line_id].append({
                    'interval': l_interval,
                    'presence': l_presence,
                    'job_id': job.id,
                    'start': start_var,
                    'end': end_var
                })

            if machine_options:
                model.add_exactly_one([opt[1] for opt in machine_options])
            
            # --- OPERATOR ASSIGNMENT ---
            capable_ops = [op for op in req.operators if task.skill in op.skills]
            op_options = []
            for op in capable_ops:
                alt_op_suffix = f"{suffix}_{op.id}"
                op_presence = model.new_bool_var(f"presence_op{alt_op_suffix}")
                op_interval = model.new_optional_interval_var(start_var, task.duration, end_var, op_presence, f"interval_op{alt_op_suffix}")
                
                op_options.append((op.id, op_presence))
                operator_to_intervals[op.id].append(op_interval)
            
            if op_options:
                model.add_exactly_one([opt[1] for opt in op_options])
            
            task_info[job_idx, t_idx] = {
                'lines': machine_options,
                'operators': op_options
            }

    # --- SHIFTS / AVAILABILITIES (FORBIDDEN INTERVALS) ---
    def apply_availability(resource_id, all_intervals, availabilities):
        # Find if this resource has specific availability
        res_avail = next((a for a in availabilities if a.resourceId == resource_id), None)
        if not res_avail:
            return
        
        # Create forbidden intervals (gaps where the resource is NOT available)
        # Assuming horizon is the max time
        forbidden = []
        last_end = 0
        sorted_intervals = sorted(res_avail.intervals, key=lambda x: x.start)
        
        for interval in sorted_intervals:
            if interval.start > last_end:
                # Gap between last end and current start
                forbidden.append(model.new_interval_var(last_end, interval.start - last_end, interval.start, f"gap_{resource_id}_{last_end}"))
            last_end = interval.end
        
        if last_end < horizon:
            forbidden.append(model.new_interval_var(last_end, horizon - last_end, horizon, f"gap_{resource_id}_{last_end}"))
        
        # Add no overlap between task intervals and forbidden gaps
        model.add_no_overlap(all_intervals + forbidden)

    # Constraint: No overlap on lines (including shifts and setup times)
    for line_id, data_list in line_to_intervals.items():
        intervals = [d['interval'] for d in data_list]
        
        # Apply shifts if any
        if req.availabilities:
            apply_availability(line_id, intervals, req.availabilities)
        else:
            model.add_no_overlap(intervals)
            
        # Apply setup times if any
        if req.setupTimes:
            line_setups = [s for s in req.setupTimes if s.lineId == line_id]
            if line_setups:
                num_tasks = len(data_list)
                nodes = range(num_tasks + 1)
                depot = num_tasks
                arcs = []
                for i in range(num_tasks):
                    presence_i = data_list[i]['presence']
                    
                    # Depot -> i
                    lit_start = model.new_bool_var(f"arc_depot_{i}_{line_id}")
                    # Depot outgoing arcs sum to 1 (AddCircuit handles this if we include depot)
                    arcs.append((depot, i, lit_start))
                    
                    # i -> Depot
                    lit_end = model.new_bool_var(f"arc_{i}_depot_{line_id}")
                    arcs.append((i, depot, lit_end))
                    
                    # i -> i (if not present)
                    lit_self = model.new_bool_var(f"arc_{i}_{i}_{line_id}")
                    model.add(lit_self == presence_i.Not())
                    arcs.append((i, i, lit_self))
                    
                    for j in range(num_tasks):
                        if i == j: continue
                        lit_ij = model.new_bool_var(f"arc_{i}_{j}_{line_id}")
                        arcs.append((i, j, lit_ij))
                        
                        # Find setup time
                        setup = next((s for s in line_setups if s.fromJobId == data_list[i]['job_id'] and s.toJobId == data_list[j]['job_id']), None)
                        if setup:
                            model.add(data_list[i]['end'] + setup.duration <= data_list[j]['start']).only_enforce_if(lit_ij)
                
                # Depot loop (optional if no tasks assigned)
                # Not needed if depot is just a routing point
                model.add_circuit(arcs)

    # Constraint: No overlap for operators (including shifts)
    for op_id, intervals in operator_to_intervals.items():
        if req.availabilities:
            apply_availability(op_id, intervals, req.availabilities)
        else:
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

    # Objective: Minimize Weighted Tardiness (Primary) + Makespan (Secondary) + StartTimes (Tertiary/Tie-Breaker)
    # Scaled to prioritize tardiness
    # Adding 'start_vars' sum helps compact the schedule to the left, reducing "floating" tasks and stabilizing results.
    all_start_ints = []
    for job_idx, job in enumerate(req.jobs):
         for t_idx in range(len(job.tasks)):
             all_start_ints.append(job_starts[job_idx, t_idx])
    
    model.minimize(total_weighted_tardiness * 10000 + makespan * 100 + sum(all_start_ints))

    # Solve
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10.0
    # FORCE DETERMINISM: Single thread ensures results are identical for the same input
    solver.parameters.num_search_workers = 1 
    status = solver.solve(model)

    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        results = []
        for job_idx, job in enumerate(req.jobs):
            res_job = {"id": job.id, "name": job.name, "tasks": [], "color": job.color}
            for t_idx, task in enumerate(job.tasks):
                start_val = solver.value(job_starts[job_idx, t_idx])
                end_val = solver.value(job_ends[job_idx, t_idx])
                
                info = task_info[job_idx, t_idx]
                
                line_id = "Unknown"
                for l_id, l_presence in info['lines']:
                    if solver.boolean_value(l_presence):
                        line_id = l_id
                        break
                
                op_id = "None"
                for o_id, o_presence in info['operators']:
                    if solver.boolean_value(o_presence):
                        op_id = o_id
                        break
                
                res_job["tasks"].append({
                    "id": task.id,
                    "name": task.name,
                    "start": start_val,
                    "end": end_val,
                    "duration": task.duration,
                    "color": job.color,
                    "line": line_id,
                    "operator": op_id,
                    "priority": job.priority,
                    "dueDate": job.dueDate,
                    "manualStart": task.manualStart
                })
            results.append(res_job)
        
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
