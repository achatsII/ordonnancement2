from pydantic import BaseModel
from typing import List, Dict, Optional

class Task(BaseModel):
    id: str
    name: str
    eligibleLines: List[str]
    duration: int
    skill: str
    order: Optional[int] = 0
    manualStart: Optional[int] = None

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

class SetupTime(BaseModel):
    lineId: str
    fromJobId: str
    toJobId: str
    duration: int

class AvailabilityInterval(BaseModel):
    start: int
    end: int

class ResourceAvailability(BaseModel):
    resourceId: str
    intervals: List[AvailabilityInterval]

class SolveRequest(BaseModel):
    jobs: List[Job]
    lines: List[Line]
    operators: List[Operator]
    setupTimes: Optional[List[SetupTime]] = []
    availabilities: Optional[List[ResourceAvailability]] = []

# ===== WHAT-IF MODELS =====

class WhatIfModification(BaseModel):
    type: str  # 'delay_order', 'machine_down', 'operator_unavailable', 'shift_change'
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
    currentSolveRequest: SolveRequest
    currentTasks: List[Dict]

class JobImpact(BaseModel):
    jobId: str
    jobName: str
    endTimeBefore: str
    endTimeAfter: str
    deltaHours: float
    status: str

class ImpactAnalysis(BaseModel):
    jobImpacts: List[JobImpact]
    globalMetrics: Dict
