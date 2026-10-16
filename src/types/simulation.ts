export type ScenarioId =
  | "baseline"
  | "move_bins"
  | "add_tool"
  | "add_robot";

export type IndustryPresetId =
  | "cnc_metal_shop"
  | "food_copacking"
  | "medical_device"
  | "pcb_box_build";

export type AgentPolicyMode = "fixed_fifo" | "ai_adaptive";

export type ProductId = "productA" | "productB";

export type StationType =
  | "workbench_assembly"
  | "workbench_inspect"
  | "part_bin"
  | "shared_tool"
  | "robot_dock"
  | "shipping_out";

export interface StationNode {
  id: string;
  label: string;
  subLabel: string;
  type: StationType;
  x: number; // Grid coordinate 0..12
  y: number; // Grid coordinate 0..8
  fixed?: boolean; // e.g., Workbench 3 is fixed due to inspection rig
  assignedWorkerId?: string;
}

export interface ProcessTimingValue {
  seconds: number;
  source: "measured" | "assumed"; // 측정값 vs 가정값 표시
  note?: string;
}

export interface ProductSpec {
  id: ProductId;
  partNumber?: string;
  name: string;
  shortName: string;
  color: string;
  badgeColor: string;
  description: string;
  orderCount: number;
  timings: {
    pickHandling: ProcessTimingValue; // Op 10: 자재 불출·전처리 시간 (이동 별도)
    preAssembly: ProcessTimingValue; // Op 20: 주가공·조립·배합 시간
    toolWork: ProcessTimingValue; // Op 30: 공용 병목 설비 공정 시간
    inspectionPack: ProcessTimingValue; // Op 40: 전수 품질 검사·포장 시간 (작업대 3)
  };
  requiresBins: ("binA" | "binB")[];
  requiresSharedTool: boolean;
}

export interface ProcessRealismConfig {
  changeoverSeconds: number; // 품목 A↔B 전환 시 지그/레시피 세팅 시간 (0 / 8 / 14초)
  reworkRatePercent: number; // Op 40 전수 검사 시 불량 재작업 반송 비율 (0 / 15 / 25%)
  hourlyLaborRateUSD: number; // 미국 기준 작업자 시간당 인건비 ($28/hr)
  hourlyLaborRateKRW: number; // 한국 기준 작업자 시간당 인건비 (22,000원/hr)
}

export type WorkerActionState =
  | "IDLE"
  | "MOVING_TO_BIN"
  | "PICKING_PARTS"
  | "WAITING_FOR_ROBOT_DELIVERY"
  | "MOVING_TO_WB"
  | "CHANGEOVER_SETUP"
  | "PRE_ASSEMBLING"
  | "REWORK_REPAIR"
  | "WAITING_FOR_TOOL"
  | "MOVING_TO_TOOL"
  | "USING_TOOL"
  | "DELIVERING_TO_INSPECT"
  | "WAITING_FOR_INSPECT_QUEUE"
  | "INSPECTING_PACKING"
  | "PRE_PICKING_NEXT";

export interface AgentDecisionEvent {
  time: number;
  agentId: string;
  agentName: string;
  situation: string;
  optionsConsidered: string[];
  chosenAction: string;
  reason: string;
  impactTag: string;
}

export interface AgentSnapshot {
  id: string;
  name: string;
  role: "assembly_1" | "assembly_2" | "inspector" | "transport_robot";
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  state: WorkerActionState;
  stateLabel: string;
  currentProduct?: ProductId;
  currentOrderIndex?: number;
  holdingTool?: boolean;
  holdingParts?: boolean;
  prePickedPartsReady?: boolean;
  isReworkItem?: boolean;
  thoughtBubble?: string;
  isWaitingBottleneck?: boolean;
}

export interface StationQueueSnapshot {
  stationId: string;
  wipCount: number;
  waitingAgentIds: string[];
  isCongested: boolean;
  utilizationRatio: number;
}

export interface SimulationTickSnapshot {
  time: number; // in seconds (step = 0.5s)
  completedCount: number;
  completedByProduct: Record<ProductId, number>;
  agents: AgentSnapshot[];
  stationQueues: Record<string, StationQueueSnapshot>;
  toolOccupiedBy: string | null;
  tool2OccupiedBy: string | null;
  inspectQueueItems: {
    orderId: number;
    productId: ProductId;
    arrivedAt: number;
    isReworked?: boolean;
  }[];
  activeHighlightBanner?: string;
}

export interface BottleneckInsight {
  id: string;
  severity: "critical" | "warning" | "positive";
  title: string;
  causalSentence: string;
  evidenceMetrics: string;
  jumpToTime: number;
  jumpEndTime: number;
  focusStationId: string;
}

export interface WorkerTimeBreakdown {
  workerId: string;
  workerName: string;
  workTime: number; // 순수 가공/조립/검사
  setupAndReworkTime: number; // 품종 교체 세팅 + 불량 재작업 시간
  moveTime: number; // 이동 시간
  waitToolTime: number; // 공용 설비 대기 시간
  waitPartsOrQueueTime: number; // 부품 대기 또는 앞 공정 유휴 대기
  prePickSavedTime: number; // 에이전트 선행 키팅으로 아낀 시간
}

export interface ScenarioSimulationResult {
  scenarioId: ScenarioId;
  scenarioName: string;
  questionTested: string;
  badgeText: string;
  policyMode: AgentPolicyMode;
  addedCostKRW: number;
  addedCostUSD: number;
  costLabel: string;
  totalOrders: number;
  completedOrders: number;
  totalCompletionTime: number; // 전체 로트 완료 시간 (초)
  throughputPer10Min: number; // 10분당 환산 생산량
  bottleneckCycleTimeSec: number; // 개당 평균 병목 사이클타임 (C/T, 초)
  unitsPerHour: number; // 시간당 생산량 (UPH, 85% 실가동 기준)
  shiftOutput8h: number; // 8시간 시프트(450분 실가동) 기준 일일 생산량 (개)
  laborCostPerUnitKRW: number; // 개당 직접 노무비 (원/개)
  laborCostPerUnitUSD: number; // 개당 직접 노무비 ($/ea)
  paybackMonths: number | null; // 설비 투자 회수 기간 (개월, 기준안 대비)
  changeoverTotalSeconds: number; // 누적 세팅 손실 시간 (초)
  reworkCount: number; // 품질 재작업 발생 건수 (건)
  reworkTotalSeconds: number; // 누적 재작업 소요 시간 (초)
  avgWorkTime: number;
  avgMoveTime: number;
  avgWaitTime: number;
  toolWaitTotalSeconds: number;
  inspectQueueWaitTotalSeconds: number;
  maxInspectQueueLength: number;
  maxToolWaitQueue: number;
  primaryBottleneckStation: string;
  shiftedBottleneckDescription: string;
  workerBreakdowns: WorkerTimeBreakdown[];
  timeline: SimulationTickSnapshot[];
  decisionEvents: AgentDecisionEvent[];
  insights: BottleneckInsight[];
  layoutStations: StationNode[];
}

export interface ConstraintConfig {
  rawNaturalLanguage: string;
  keepHeadcount3: boolean;
  workbench3Fixed: boolean;
  inspectorDedicated: boolean;
  maxExtraTools: number;
  allowBinRelocation: boolean;
  allowTransportRobot: boolean;
  budgetLimitKRW: number;
  costMoveBinsKRW: number;
  costAddToolKRW: number;
  costAddRobotKRW: number;
  costMoveBinsUSD: number;
  costAddToolUSD: number;
  costAddRobotUSD: number;
}

export interface PhysicalValidationRecord {
  id: string;
  scenarioId: ScenarioId;
  scenarioName: string;
  trialOrder: string;
  predictedCompletionSec: number;
  actualMeasuredSec: number | null;
  predictedPrimaryBottleneck: string;
  actualObservedBottleneck: string;
  toolWaitMeasuredSec: number | null;
  inspectMaxWipMeasured: number | null;
  directionMatched: boolean;
  notes: string;
}
