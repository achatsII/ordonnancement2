from typing import List, Dict
from datetime import datetime, timedelta

# Helper function to apply What-If modifications
def apply_whatif_modifications(solve_request, modifications: List) -> any:
    """
    Apply What-If modifications to a solve request.
    Returns a modified copy of the solve request.
    """
    import copy
    modified_request = copy.deepcopy(solve_request)
    
    for mod in modifications:
        mod_type = mod.type
        params = mod.parameters
        
        if mod_type == 'delay_order':
            # Delay a specific order by X hours
            order_id = params.get('orderId')
            delay_hours = params.get('delayHours', 0)
            delay_minutes = int(delay_hours * 60)
            
            # Find the job and delay all its tasks
            for job in modified_request.jobs:
                if job.id == order_id:
                    for task in job.tasks:
                        if task.manualStart is not None:
                            task.manualStart += delay_minutes
                        else:
                            task.manualStart = delay_minutes
        
        elif mod_type == 'machine_down':
            # Remove a machine from available lines
            machine_id = params.get('machineId')
            modified_request.lines = [line for line in modified_request.lines if line.id != machine_id]
            
            # Remove machine from eligible lines in tasks
            for job in modified_request.jobs:
                for task in job.tasks:
                    if machine_id in task.eligibleLines:
                        task.eligibleLines.remove(machine_id)
        
        elif mod_type == 'operator_unavailable':
            # Remove an operator
            operator_id = params.get('operatorId')
            modified_request.operators = [op for op in modified_request.operators if op.id != operator_id]
        
        elif mod_type == 'task_move':
            # Move a specific task to a new start time
            task_id = params.get('taskId')
            new_start = params.get('newStartTime')  # in minutes
            
            # Parse task_id (format: jobId-tX)
            # Parse task_id (format: jobId-task-X or jobId-tX)
            # Frontend uses: order.id + "-task-" + idx
            task_idx = 0
            job_id_found = None
            
            if '-task-' in task_id:
                 # Handle modern frontend format
                 job_id_found, task_part = task_id.rsplit('-task-', 1)
                 try:
                     task_idx = int(task_part)
                 except ValueError:
                     print(f"Error parsing task index from {task_part}")
                     continue
            elif '-t' in task_id:
                # Handle legacy/internal format
                job_id_found, task_part = task_id.rsplit('-t', 1)
                try:
                    task_idx = int(task_part)
                except ValueError:
                    # In case of partial match like "ask-1" from split error before
                    continue
            
            if job_id_found:
                for job in modified_request.jobs:
                    if job.id == job_id_found:
                         if task_idx < len(job.tasks):
                             # Ensure new_start is an integer
                             try:
                                job.tasks[task_idx].manualStart = int(float(new_start))
                             except (ValueError, TypeError):
                                print(f"Invalid newStartTime: {new_start}")
        
        # Add more modification types as needed
    
    return modified_request


def calculate_impact_analysis(tasks_before: List[Dict], tasks_after: List[Dict], makespan_before: int, makespan_after: int) -> Dict:
    """
    Calculate impact analysis comparing before/after schedules.
    """
    # Group tasks by job
    job_times_before = {}
    job_times_after = {}
    
    for task in tasks_before:
        job_id = task.get('job_id', '')
        job_name = task.get('job_name', '')
        end_time = task.get('start', 0) + task.get('duration', 0)
        
        if job_id not in job_times_before:
            job_times_before[job_id] = {'name': job_name, 'end': end_time}
        else:
            job_times_before[job_id]['end'] = max(job_times_before[job_id]['end'], end_time)
    
    for task in tasks_after:
        job_id = task.get('job_id', '')
        job_name = task.get('job_name', '')
        end_time = task.get('start', 0) + task.get('duration', 0)
        
        if job_id not in job_times_after:
            job_times_after[job_id] = {'name': job_name, 'end': end_time}
        else:
            job_times_after[job_id]['end'] = max(job_times_after[job_id]['end'], end_time)
    
    # Calculate job impacts
    job_impacts = []
    for job_id in job_times_before.keys():
        before = job_times_before.get(job_id, {})
        after = job_times_after.get(job_id, before)
        
        end_before = before.get('end', 0)
        end_after = after.get('end', 0)
        delta_minutes = end_after - end_before
        delta_hours = delta_minutes / 60.0
        
        status = 'neutral'
        if delta_hours < -0.5:
            status = 'improved'
        elif delta_hours > 0.5:
            status = 'degraded'
        
        from datetime import datetime, timedelta
        base_time = datetime(2024, 1, 1, 8, 0)  # Start at 8 AM
        
        job_impacts.append({
            'jobId': job_id,
            'jobName': before.get('name', job_id),
            'endTimeBefore': (base_time + timedelta(minutes=end_before)).isoformat(),
            'endTimeAfter': (base_time + timedelta(minutes=end_after)).isoformat(),
            'deltaHours': round(delta_hours, 2),
            'status': status
        })
    
    # Global metrics
    utilization_before = 75.0  # Placeholder
    utilization_after = 73.0   # Placeholder
    deadlines_met_before = len([j for j in job_impacts if j['deltaHours'] <= 0])
    deadlines_met_after = len([j for j in job_impacts if j['status'] != 'degraded'])
    
    return {
        'jobImpacts': job_impacts,
        'globalMetrics': {
            'makespanBefore': makespan_before,
            'makespanAfter': makespan_after,
            'makespanDelta': makespan_after - makespan_before,
            'utilizationBefore': utilization_before,
            'utilizationAfter': utilization_after,
            'deadlinesMetBefore': deadlines_met_before,
            'deadlinesMetAfter': deadlines_met_after
        }
    }
