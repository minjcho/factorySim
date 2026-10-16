import {
  AgentDecisionEvent,
  AgentPolicyMode,
  AgentSnapshot,
  BottleneckInsight,
  ConstraintConfig,
  ProcessRealismConfig,
  ProductId,
  ProductSpec,
  ScenarioId,
  ScenarioSimulationResult,
  SimulationTickSnapshot,
  StationNode,
  StationQueueSnapshot,
  WorkerActionState,
  WorkerTimeBreakdown,
} from "@/types/simulation";
import { DEFAULT_REALISM_CONFIG } from "@/lib/presets";

const DT = 0.5; // 0.5 second simulation step
const WORKER_WALK_SPEED = 2.05; // grid units per second
const ROBOT_MOVE_SPEED = 2.4; // grid units per second

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

function moveTowards(
  currX: number,
  currY: number,
  targetX: number,
  targetY: number,
  speed: number,
  dt: number
): { x: number; y: number; arrived: boolean; movedDist: number } {
  const d = dist(currX, currY, targetX, targetY);
  const maxStep = speed * dt;
  if (d <= maxStep + 0.01) {
    return { x: targetX, y: targetY, arrived: true, movedDist: d };
  }
  const ratio = maxStep / d;
  return {
    x: currX + (targetX - currX) * ratio,
    y: currY + (targetY - currY) * ratio,
    arrived: false,
    movedDist: maxStep,
  };
}

export function buildScenarioStations(
  baseStations: StationNode[],
  scenarioId: ScenarioId
): StationNode[] {
  const cloned: StationNode[] = baseStations.map((s) => ({ ...s }));
  const wb1 = cloned.find((s) => s.id === "wb1")!;
  const wb2 = cloned.find((s) => s.id === "wb2")!;

  if (scenarioId === "move_bins") {
    const binA = cloned.find((s) => s.id === "binA");
    const binB = cloned.find((s) => s.id === "binB");
    if (binA && !binA.fixed) {
      binA.x = 2.25;
      binA.y = wb1.y;
      binA.subLabel = "Op 20 #1 라인사이드 밀착 배치 (동선 65% 단축)";
    }
    if (binB && !binB.fixed) {
      binB.x = 2.25;
      binB.y = wb2.y;
      binB.subLabel = "Op 20 #2 라인사이드 밀착 배치 (동선 65% 단축)";
    }
  }

  if (scenarioId === "add_tool") {
    const tool1 = cloned.find((s) => s.id === "tool1");
    if (tool1) {
      tool1.x = 7.7;
      tool1.y = wb1.y;
    }
    cloned.push({
      id: "tool2",
      label: tool1 ? `${tool1.label.replace("#1", "#2")}` : "Op 30: 추가 설비 #2",
      subLabel: "Op 30 병목 설비 2호기 증설 (+1대)",
      type: "shared_tool",
      x: 7.7,
      y: wb2.y,
      fixed: false,
    });
  }

  if (scenarioId === "add_robot") {
    cloned.push({
      id: "robotDock",
      label: "자율주행 자재 로봇 (AMR)",
      subLabel: "Op 10→Op 20 무인 이송 AGV",
      type: "robot_dock",
      x: 3.0,
      y: 4.0,
      fixed: false,
    });
  }

  return cloned;
}

interface InternalOrder {
  orderId: number;
  productId: ProductId;
  isReworked?: boolean;
}

interface InternalAssemblyWorker {
  id: "worker1" | "worker2";
  name: string;
  role: "assembly_1" | "assembly_2";
  homeWbId: "wb1" | "wb2";
  x: number;
  y: number;
  state: WorkerActionState;
  stateTimer: number;
  currentOrder: InternalOrder | null;
  prePickedOrder: InternalOrder | null;
  lastProductWorked: ProductId | null;
  targetStationId: string | null;
  claimedToolId: "tool1" | "tool2" | null;
  thoughtBubble: string;
  workTime: number;
  setupAndReworkTime: number;
  moveTime: number;
  waitToolTime: number;
  waitPartsOrQueueTime: number;
  prePickSavedTime: number;
}

export function runScenarioSimulation(params: {
  scenarioId: ScenarioId;
  policyMode: AgentPolicyMode;
  baseStations: StationNode[];
  products: Record<ProductId, ProductSpec>;
  constraints: ConstraintConfig;
  realism?: ProcessRealismConfig;
  baselineReference?: ScenarioSimulationResult;
}): ScenarioSimulationResult {
  const {
    scenarioId,
    policyMode,
    baseStations,
    products,
    constraints,
    realism = DEFAULT_REALISM_CONFIG,
    baselineReference,
  } = params;

  const stations = buildScenarioStations(baseStations, scenarioId);
  const stationMap = new Map<string, StationNode>();
  stations.forEach((s) => stationMap.set(s.id, s));

  const wb1 = stationMap.get("wb1")!;
  const wb2 = stationMap.get("wb2")!;
  const wb3 = stationMap.get("wb3")!;
  const binA = stationMap.get("binA")!;
  const binB = stationMap.get("binB")!;
  const tool1 = stationMap.get("tool1")!;
  const tool2 = stationMap.get("tool2") || null;
  const robotDock = stationMap.get("robotDock") || null;

  const countA = Math.max(0, Math.round(products.productA.orderCount));
  const countB = Math.max(0, Math.round(products.productB.orderCount));
  const totalOrders = countA + countB;

  const pendingOrders: InternalOrder[] = [];
  let remA = countA;
  let remB = countB;
  let nextId = 1;
  // Pairwise release [A, A, B, B, A, A, B, B...] reflects realistic ERP work-order tickets
  while (remA > 0 || remB > 0) {
    if (remA > 0) {
      pendingOrders.push({ orderId: nextId++, productId: "productA" });
      remA--;
    }
    if (remA > 0) {
      pendingOrders.push({ orderId: nextId++, productId: "productA" });
      remA--;
    }
    if (remB > 0) {
      pendingOrders.push({ orderId: nextId++, productId: "productB" });
      remB--;
    }
    if (remB > 0) {
      pendingOrders.push({ orderId: nextId++, productId: "productB" });
      remB--;
    }
  }

  // Determine which orderIds will fail first-pass QC inspection at Op 40 (deterministic for reproducibility)
  const reworkTargetOrderIds = new Set<number>();
  if (realism.reworkRatePercent >= 25 && totalOrders >= 4) {
    reworkTargetOrderIds.add(Math.min(totalOrders, 3));
    if (totalOrders >= 7) reworkTargetOrderIds.add(Math.min(totalOrders, 7));
  } else if (realism.reworkRatePercent >= 10 && totalOrders >= 4) {
    reworkTargetOrderIds.add(Math.min(totalOrders, 4));
  }

  // Effective changeover time (SMED quick-change clamps in move_bins reduce setup by 25%)
  const effectiveChangeoverSec =
    realism.changeoverSeconds <= 0
      ? 0
      : scenarioId === "move_bins"
        ? Math.max(2, Math.round(realism.changeoverSeconds * 0.75))
        : realism.changeoverSeconds;

  const workers: InternalAssemblyWorker[] = [
    {
      id: "worker1",
      name: "작업자 1 (Op 20 #1)",
      role: "assembly_1",
      homeWbId: "wb1",
      x: wb1.x,
      y: wb1.y,
      state: "IDLE",
      stateTimer: 0,
      currentOrder: null,
      prePickedOrder: null,
      lastProductWorked: null,
      targetStationId: null,
      claimedToolId: null,
      thoughtBubble: "작업 지시 대기",
      workTime: 0,
      setupAndReworkTime: 0,
      moveTime: 0,
      waitToolTime: 0,
      waitPartsOrQueueTime: 0,
      prePickSavedTime: 0,
    },
    {
      id: "worker2",
      name: "작업자 2 (Op 20 #2)",
      role: "assembly_2",
      homeWbId: "wb2",
      x: wb2.x,
      y: wb2.y,
      state: "IDLE",
      stateTimer: 0,
      currentOrder: null,
      prePickedOrder: null,
      lastProductWorked: null,
      targetStationId: null,
      claimedToolId: null,
      thoughtBubble: "작업 지시 대기",
      workTime: 0,
      setupAndReworkTime: 0,
      moveTime: 0,
      waitToolTime: 0,
      waitPartsOrQueueTime: 0,
      prePickSavedTime: 0,
    },
  ];

  // Inspector (Worker 3 at Op 40 Workbench 3)
  const inspector = {
    id: "worker3",
    name: "작업자 3 (Op 40 품질검수)",
    role: "inspector" as const,
    x: wb3.x,
    y: wb3.y,
    state: "IDLE" as WorkerActionState,
    stateTimer: 0,
    currentItem: null as {
      orderId: number;
      productId: ProductId;
      arrivedAt: number;
      isReworked?: boolean;
    } | null,
    thoughtBubble: "Op 40 검사 대기",
    workTime: 0,
    setupAndReworkTime: 0,
    moveTime: 0,
    waitPartsOrQueueTime: 0,
  };

  // Optional Transport Robot (Scenario: add_robot)
  const robot =
    scenarioId === "add_robot" && robotDock
      ? {
          id: "robot1",
          name: "자율주행 로봇 (AMR)",
          role: "transport_robot" as const,
          x: robotDock.x,
          y: robotDock.y,
          phase: "IDLE" as "IDLE" | "TO_BIN" | "LOADING" | "TO_WB",
          timer: 0,
          targetWbId: null as "wb1" | "wb2" | null,
          carryingOrder: null as InternalOrder | null,
          thoughtBubble: "이송 지시 대기",
          workTime: 0,
          moveTime: 0,
        }
      : null;

  const wbDeliveredQueue: Record<"wb1" | "wb2", InternalOrder[]> = {
    wb1: [],
    wb2: [],
  };
  const reworkReturnQueue: InternalOrder[] = [];

  let tool1Holder: "worker1" | "worker2" | null = null;
  let tool2Holder: "worker1" | "worker2" | null = null;

  const inspectQueue: {
    orderId: number;
    productId: ProductId;
    arrivedAt: number;
    isReworked?: boolean;
  }[] = [];
  const completedByProduct: Record<ProductId, number> = {
    productA: 0,
    productB: 0,
  };
  let completedCount = 0;
  let changeoverTotalSeconds = 0;
  let reworkCount = 0;
  let reworkTotalSeconds = 0;

  const decisionEvents: AgentDecisionEvent[] = [];
  const timeline: SimulationTickSnapshot[] = [];

  let inspectQueueWaitTotalSeconds = 0;
  let maxInspectQueueLength = 0;
  let maxToolWaitQueue = 0;
  let peakToolWaitTime = 15;
  let peakInspectQueueTime = 45;

  function selectNextOrder(
    requesterName: string,
    lastProduct: ProductId | null,
    otherWorkerProduct: ProductId | null,
    currentTime: number
  ): InternalOrder | null {
    if (pendingOrders.length === 0) return null;

    if (policyMode === "fixed_fifo") {
      return pendingOrders.shift()!;
    }

    // AI Adaptive policy:
    // Balances 3 shop-floor constraints simultaneously:
    // 1. Downstream Op 40 queue protection (if >= 2 Product B items waiting, prioritize Product A)
    // 2. Concurrent cell balancing at shift start (Worker 1 takes A, Worker 2 takes B so A & B flow in parallel)
    // 3. Op 20 SMED setup changeover minimization (prefer matching lastProductWorked when downstream allows)
    const bInInspect =
      inspectQueue.filter((i) => i.productId === "productB").length +
      (inspector.currentItem?.productId === "productB" ? 1 : 0);

    let desiredProduct: ProductId | null = null;
    let reason = "";

    if (bInInspect >= 2) {
      desiredProduct = "productA";
      reason = `Op 40 검사대에 장시간 검수 품목 B가 ${bInInspect}개 적체됨 → 후공정 병목 방지를 위해 품목 A 우선 투입`;
    } else if (!lastProduct && otherWorkerProduct === "productA") {
      desiredProduct = "productB";
      reason = `상대 작업자가 품목 A 착수 → 설비 충돌 회피 및 동시 평준화(Heijunka)를 위해 품목 B 전담 착수`;
    } else if (!lastProduct && otherWorkerProduct === "productB") {
      desiredProduct = "productA";
      reason = `상대 작업자가 품목 B 착수 → 라인 밸런싱을 위해 품목 A 전담 착수`;
    } else if (effectiveChangeoverSec >= 4 && lastProduct && bInInspect < 2) {
      desiredProduct = lastProduct;
      reason = `품종 전환 세팅 손실(${effectiveChangeoverSec}초) 방지를 위해 동일 품목(${lastProduct === "productA" ? "A" : "B"}) 연속 로트 묶음 투입`;
    } else if (otherWorkerProduct === "productA" && !tool2) {
      desiredProduct = "productB";
      reason = `상대 작업자가 Op 30 장시간 점유 품목 A 작업 중 → 공용 설비 충돌 회피를 위해 품목 B 교차 투입`;
    }

    if (desiredProduct && pendingOrders[0].productId !== desiredProduct) {
      const altIdx = pendingOrders.findIndex((o) => o.productId === desiredProduct);
      if (altIdx > 0) {
        const [chosen] = pendingOrders.splice(altIdx, 1);
        decisionEvents.push({
          time: currentTime,
          agentId: requesterName,
          agentName: requesterName,
          situation: `다음 작업 지시 선택 (대기 로트 ${pendingOrders.length + 1}건)`,
          optionsConsidered: [
            `FIFO 순서대로 ${pendingOrders[0].productId === "productA" ? "품목 A" : "품목 B"} 투입`,
            `세팅·병목 최적화를 위해 ${desiredProduct === "productA" ? "품목 A" : "품목 B"} 우선 투입`,
          ],
          chosenAction: `${desiredProduct === "productA" ? "품목 A" : "품목 B"} (#${chosen.orderId}) 스마트 스케줄링`,
          reason,
          impactTag: "세팅·병목 최적화",
        });
        return chosen;
      }
    }

    return pendingOrders.shift()!;
  }

  function getRemainingToolWaitSeconds(): number {
    if (!tool1Holder && (!tool2 || !tool2Holder)) return 0;
    if (tool2 && (!tool1Holder || !tool2Holder)) return 0;
    const holders = workers.filter(
      (w) => w.id === tool1Holder || (tool2 && w.id === tool2Holder)
    );
    if (holders.length === 0) return 0;
    return Math.min(...holders.map((h) => Math.max(0, h.stateTimer)));
  }

  function tryClaimTool(worker: InternalAssemblyWorker): "tool1" | "tool2" | null {
    if (tool2 && worker.id === "worker2" && !tool2Holder) {
      tool2Holder = worker.id;
      return "tool2";
    }
    if (!tool1Holder) {
      tool1Holder = worker.id;
      return "tool1";
    }
    if (tool2 && !tool2Holder) {
      tool2Holder = worker.id;
      return "tool2";
    }
    return null;
  }

  function releaseTool(worker: InternalAssemblyWorker) {
    if (tool1Holder === worker.id) tool1Holder = null;
    if (tool2Holder === worker.id) tool2Holder = null;
    worker.claimedToolId = null;
  }

  function startWorkstationPhase(w: InternalAssemblyWorker, order: InternalOrder) {
    w.currentOrder = order;
    if (order.isReworked) {
      w.state = "REWORK_REPAIR";
      w.stateTimer = 5.0; // Rework / deburr / re-torque duration
      w.thoughtBubble = `🛠️ #${order.orderId} 불량 재작업·보정 중 (5s)`;
      return;
    }
    const needsChangeover =
      effectiveChangeoverSec > 0 &&
      w.lastProductWorked !== null &&
      w.lastProductWorked !== order.productId;

    if (needsChangeover) {
      w.state = "CHANGEOVER_SETUP";
      w.stateTimer = effectiveChangeoverSec;
      w.thoughtBubble = `🔄 품종 전환 지그·레시피 세팅 중 (${effectiveChangeoverSec}s)`;
    } else {
      w.state = "PRE_ASSEMBLING";
      const spec = products[order.productId];
      w.stateTimer = spec.timings.preAssembly.seconds;
      w.lastProductWorked = order.productId;
      w.thoughtBubble = `#${order.orderId} (${spec.shortName}) Op 20 작업 중`;
    }
  }

  const MAX_SIM_TIME = 720; // safety cap 12 mins
  let currentTime = 0;

  while (completedCount < totalOrders && currentTime <= MAX_SIM_TIME) {
    // 1. Update Transport Robot if active
    if (robot) {
      if (robot.phase === "IDLE") {
        if (pendingOrders.length > 0) {
          const w1Needs =
            (workers[0].currentOrder ? 1 : 0) + wbDeliveredQueue.wb1.length;
          const w2Needs =
            (workers[1].currentOrder ? 1 : 0) + wbDeliveredQueue.wb2.length;

          let targetWb: "wb1" | "wb2" = w1Needs <= w2Needs ? "wb1" : "wb2";
          if (policyMode === "ai_adaptive") {
            if (
              workers[1].state === "WAITING_FOR_ROBOT_DELIVERY" &&
              workers[0].state !== "WAITING_FOR_ROBOT_DELIVERY"
            ) {
              targetWb = "wb2";
            } else if (
              workers[0].state === "WAITING_FOR_ROBOT_DELIVERY" &&
              workers[1].state !== "WAITING_FOR_ROBOT_DELIVERY"
            ) {
              targetWb = "wb1";
            }
          }

          const targetW = targetWb === "wb1" ? workers[0] : workers[1];
          const otherW = targetWb === "wb1" ? workers[1] : workers[0];
          const nextOrd = selectNextOrder(
            robot.name,
            targetW.lastProductWorked,
            otherW.currentOrder?.productId || null,
            currentTime
          );
          if (nextOrd) {
            robot.carryingOrder = nextOrd;
            robot.targetWbId = targetWb;
            robot.phase = "TO_BIN";
            robot.thoughtBubble = `#${nextOrd.orderId} 자재 픽업 이동`;
          }
        } else {
          robot.thoughtBubble = "자재 불출 완료";
        }
      } else if (robot.phase === "TO_BIN") {
        const targetBin =
          robot.carryingOrder?.productId === "productA" ? binA : binB;
        const mv = moveTowards(
          robot.x,
          robot.y,
          targetBin.x + 0.4,
          targetBin.y,
          ROBOT_MOVE_SPEED,
          DT
        );
        robot.x = mv.x;
        robot.y = mv.y;
        robot.moveTime += DT;
        if (mv.arrived) {
          robot.phase = "LOADING";
          robot.timer = 2.0;
          robot.thoughtBubble = `#${robot.carryingOrder?.orderId} 자재 적재 중`;
        }
      } else if (robot.phase === "LOADING") {
        robot.timer -= DT;
        robot.workTime += DT;
        if (robot.timer <= 0.01) {
          robot.phase = "TO_WB";
          robot.thoughtBubble = `${robot.targetWbId === "wb1" ? "Op 20 #1" : "Op 20 #2"}로 이송 중`;
        }
      } else if (robot.phase === "TO_WB") {
        const destWb = robot.targetWbId === "wb1" ? wb1 : wb2;
        const mv = moveTowards(
          robot.x,
          robot.y,
          destWb.x - 0.7,
          destWb.y,
          ROBOT_MOVE_SPEED,
          DT
        );
        robot.x = mv.x;
        robot.y = mv.y;
        robot.moveTime += DT;
        if (mv.arrived && robot.carryingOrder && robot.targetWbId) {
          wbDeliveredQueue[robot.targetWbId].push(robot.carryingOrder);
          robot.carryingOrder = null;
          robot.targetWbId = null;
          robot.phase = "IDLE";
          robot.thoughtBubble = "자재 이송 완료";
        }
      }
    }

    // 2. Update Assembly / Machining Workers (Worker 1 & Worker 2)
    for (let idx = 0; idx < workers.length; idx++) {
      const w = workers[idx];
      const otherW = workers[1 - idx];
      const homeWb = w.homeWbId === "wb1" ? wb1 : wb2;

      if (w.state === "IDLE") {
        // Priority 0: Check if there is a QC rework item returned from Op 40
        if (reworkReturnQueue.length > 0) {
          const reworkOrd = reworkReturnQueue.shift()!;
          w.currentOrder = reworkOrd;
          w.state = "MOVING_TO_WB";
          w.thoughtBubble = `⚠️ #${reworkOrd.orderId} 품질 재작업 반송 수령`;
          continue;
        }

        // Priority 1: Check if we already pre-picked an order
        if (w.prePickedOrder) {
          w.currentOrder = w.prePickedOrder;
          w.prePickedOrder = null;
          w.state = "MOVING_TO_WB";
          w.thoughtBubble = `선행 키팅해둔 #${w.currentOrder.orderId} 즉시 착수!`;
          continue;
        }

        // If robot scenario: walk back to home workbench and wait for robot delivery
        if (scenarioId === "add_robot") {
          const atHomeWb = dist(w.x, w.y, homeWb.x, homeWb.y) <= 0.15;
          if (!atHomeWb) {
            if (
              pendingOrders.length > 0 ||
              robot?.carryingOrder !== null ||
              wbDeliveredQueue[w.homeWbId].length > 0 ||
              reworkReturnQueue.length > 0
            ) {
              w.state = "MOVING_TO_WB";
              w.thoughtBubble = `${homeWb.label}로 복귀 중`;
            } else {
              w.thoughtBubble = "할당 로트 완료";
            }
            continue;
          }

          const delivered = wbDeliveredQueue[w.homeWbId].shift();
          if (delivered) {
            startWorkstationPhase(w, delivered);
          } else if (
            pendingOrders.length > 0 ||
            robot?.carryingOrder !== null ||
            reworkReturnQueue.length > 0
          ) {
            w.state = "WAITING_FOR_ROBOT_DELIVERY";
            w.thoughtBubble = "AMR 자재 도착 대기";
          } else {
            w.thoughtBubble = "할당 로트 완료";
          }
          continue;
        }

        // Normal / Move_Bins / Add_Tool: select next order & walk to Op 10 rack
        const nextOrd = selectNextOrder(
          w.name,
          w.lastProductWorked,
          otherW.currentOrder?.productId || null,
          currentTime
        );
        if (nextOrd) {
          w.currentOrder = nextOrd;
          w.state = "MOVING_TO_BIN";
          // In move_bins, each workstation has its own lineside gravity rack with both A & B kits
          w.targetStationId =
            scenarioId === "move_bins"
              ? w.homeWbId === "wb1"
                ? "binA"
                : "binB"
              : nextOrd.productId === "productA"
                ? "binA"
                : "binB";
          w.thoughtBubble = `#${nextOrd.orderId} Op 10 자재 불출 이동`;
        } else {
          w.thoughtBubble = "Op 20 물량 완료";
        }
      } else if (w.state === "WAITING_FOR_ROBOT_DELIVERY") {
        if (reworkReturnQueue.length > 0) {
          const reworkOrd = reworkReturnQueue.shift()!;
          startWorkstationPhase(w, reworkOrd);
          continue;
        }
        const delivered = wbDeliveredQueue[w.homeWbId].shift();
        if (delivered) {
          startWorkstationPhase(w, delivered);
        } else if (
          pendingOrders.length === 0 &&
          !robot?.carryingOrder &&
          reworkReturnQueue.length === 0
        ) {
          w.state = "IDLE";
        } else {
          w.waitPartsOrQueueTime += DT;
        }
      } else if (w.state === "MOVING_TO_BIN") {
        const targetBin = w.targetStationId === "binB" ? binB : binA;
        const pickTargetX =
          scenarioId === "move_bins" ? homeWb.x - 0.25 : targetBin.x - 0.15;
        const pickTargetY =
          scenarioId === "move_bins" ? homeWb.y : targetBin.y;
        const mv = moveTowards(
          w.x,
          w.y,
          pickTargetX,
          pickTargetY,
          WORKER_WALK_SPEED,
          DT
        );
        w.x = mv.x;
        w.y = mv.y;
        w.moveTime += DT;
        if (mv.arrived && w.currentOrder) {
          w.state = "PICKING_PARTS";
          const spec = products[w.currentOrder.productId];
          w.stateTimer = spec.timings.pickHandling.seconds;
          w.thoughtBubble = `#${w.currentOrder.orderId} Op 10 자재 키팅 중`;
        }
      } else if (w.state === "PICKING_PARTS") {
        w.stateTimer -= DT;
        w.workTime += DT;
        if (w.stateTimer <= 0.01) {
          w.state = "MOVING_TO_WB";
          w.thoughtBubble = `${homeWb.label}로 복귀 중`;
        }
      } else if (w.state === "MOVING_TO_WB") {
        const mv = moveTowards(
          w.x,
          w.y,
          homeWb.x,
          homeWb.y,
          WORKER_WALK_SPEED,
          DT
        );
        w.x = mv.x;
        w.y = mv.y;
        w.moveTime += DT;
        if (mv.arrived) {
          if (w.currentOrder) {
            startWorkstationPhase(w, w.currentOrder);
          } else {
            w.state = "IDLE";
          }
        }
      } else if (w.state === "CHANGEOVER_SETUP") {
        w.stateTimer -= DT;
        w.setupAndReworkTime += DT;
        changeoverTotalSeconds += DT;
        if (w.stateTimer <= 0.01 && w.currentOrder) {
          w.state = "PRE_ASSEMBLING";
          const spec = products[w.currentOrder.productId];
          w.stateTimer = spec.timings.preAssembly.seconds;
          w.lastProductWorked = w.currentOrder.productId;
          w.thoughtBubble = `세팅 완료 → #${w.currentOrder.orderId} Op 20 본작업`;
        }
      } else if (w.state === "REWORK_REPAIR") {
        w.stateTimer -= DT;
        w.setupAndReworkTime += DT;
        reworkTotalSeconds += DT;
        if (w.stateTimer <= 0.01 && w.currentOrder) {
          w.state = "DELIVERING_TO_INSPECT";
          w.thoughtBubble = `#${w.currentOrder.orderId} 재작업 완료 → Op 40 재검수 이송`;
        }
      } else if (w.state === "PRE_ASSEMBLING") {
        w.stateTimer -= DT;
        w.workTime += DT;
        if (w.stateTimer <= 0.01 && w.currentOrder) {
          const claimed = tryClaimTool(w);
          if (claimed) {
            w.claimedToolId = claimed;
            w.state = "MOVING_TO_TOOL";
            w.thoughtBubble = `Op 30 공용 설비 진입`;
          } else {
            const remToolWait = getRemainingToolWaitSeconds();
            if (
              policyMode === "ai_adaptive" &&
              scenarioId !== "add_robot" &&
              !w.prePickedOrder &&
              pendingOrders.length > 0 &&
              remToolWait >= 4.0
            ) {
              const nextOrd = selectNextOrder(
                w.name,
                w.lastProductWorked,
                otherW.currentOrder?.productId || null,
                currentTime
              );
              if (nextOrd) {
                w.prePickedOrder = nextOrd;
                w.state = "PRE_PICKING_NEXT";
                w.stateTimer = 0;
                w.targetStationId =
                  scenarioId === "move_bins"
                    ? w.homeWbId === "wb1"
                      ? "binA"
                      : "binB"
                    : nextOrd.productId === "productA"
                      ? "binA"
                      : "binB";
                w.thoughtBubble = `💡 Op 30 설비 사용중(${remToolWait.toFixed(0)}s) → #${nextOrd.orderId} 선행 키팅!`;
                decisionEvents.push({
                  time: currentTime,
                  agentId: w.id,
                  agentName: w.name,
                  situation: `Op 20 완료 후 Op 30 공용 설비 점유됨 (잔여 ${remToolWait.toFixed(1)}초)`,
                  optionsConsidered: [
                    "Op 30 설비가 빌 때까지 제자리 대기",
                    `설비 대기 시간을 활용해 다음 로트(#${nextOrd.orderId}) 선행 키팅`,
                  ],
                  chosenAction: `다음 로트(#${nextOrd.orderId}) Op 10 선행 키팅 수행`,
                  reason: `상대 작업자의 Op 30 설비 점유 시간(${remToolWait.toFixed(1)}초) 동안 자재 랙을 다녀오면 설비 대기와 이동 손실을 동시에 상쇄`,
                  impactTag: `유휴대기→선행키팅 전환`,
                });
                continue;
              }
            }

            w.state = "WAITING_FOR_TOOL";
            w.thoughtBubble = "⏳ Op 30 공용 설비 대기 중...";
          }
        }
      } else if (w.state === "PRE_PICKING_NEXT") {
        const targetBin = w.targetStationId === "binB" ? binB : binA;
        const pickTargetX =
          scenarioId === "move_bins" ? homeWb.x - 0.25 : targetBin.x - 0.15;
        const pickTargetY =
          scenarioId === "move_bins" ? homeWb.y : targetBin.y;
        if (w.stateTimer <= 0) {
          const mv = moveTowards(
            w.x,
            w.y,
            pickTargetX,
            pickTargetY,
            WORKER_WALK_SPEED,
            DT
          );
          w.x = mv.x;
          w.y = mv.y;
          w.moveTime += DT;
          w.prePickSavedTime += DT;
          if (mv.arrived) {
            w.stateTimer = 2.5;
          }
        } else {
          w.stateTimer -= DT;
          w.workTime += DT;
          w.prePickSavedTime += DT;
          if (w.stateTimer <= 0.01) {
            w.state = "WAITING_FOR_TOOL";
            w.thoughtBubble = "선행 키팅 완료 → Op 30 설비 진입";
          }
        }
      } else if (w.state === "WAITING_FOR_TOOL") {
        const waitTargetX = tool1.x - 0.55;
        const waitTargetY = tool1.y + (w.id === "worker1" ? -0.35 : 0.35);
        const mv = moveTowards(
          w.x,
          w.y,
          waitTargetX,
          waitTargetY,
          WORKER_WALK_SPEED,
          DT
        );
        w.x = mv.x;
        w.y = mv.y;
        if (!mv.arrived) {
          w.moveTime += DT;
          w.thoughtBubble = `Op 30 공용 설비로 이동 중`;
        } else {
          const claimed = tryClaimTool(w);
          if (claimed) {
            w.claimedToolId = claimed;
            w.state = "MOVING_TO_TOOL";
            w.thoughtBubble = `Op 30 설비 확보 → 공정 시작`;
          } else {
            w.waitToolTime += DT;
            w.thoughtBubble = "⏳ Op 30 공용 설비 대기 중 (병목)";
          }
        }
      } else if (w.state === "MOVING_TO_TOOL") {
        const targetTool = w.claimedToolId === "tool2" && tool2 ? tool2 : tool1;
        const toolTargetX = targetTool.x - 0.55;
        const toolTargetY =
          targetTool.y + (tool2 ? 0 : w.id === "worker1" ? -0.35 : 0.35);
        const mv = moveTowards(
          w.x,
          w.y,
          toolTargetX,
          toolTargetY,
          WORKER_WALK_SPEED,
          DT
        );
        w.x = mv.x;
        w.y = mv.y;
        w.moveTime += DT;
        if (mv.arrived && w.currentOrder) {
          w.state = "USING_TOOL";
          const spec = products[w.currentOrder.productId];
          w.stateTimer = spec.timings.toolWork.seconds;
          w.thoughtBubble = `⚙️ Op 30 공용 설비 가동 중 (#${w.currentOrder.orderId})`;
        }
      } else if (w.state === "USING_TOOL") {
        w.stateTimer -= DT;
        w.workTime += DT;
        if (w.stateTimer <= 0.01 && w.currentOrder) {
          releaseTool(w);
          w.state = "DELIVERING_TO_INSPECT";
          w.thoughtBubble = `Op 40 검사대로 이송 중`;
        }
      } else if (w.state === "DELIVERING_TO_INSPECT") {
        const handoffX = tool1.x + 0.2;
        const handoffY = w.y;
        const mv = moveTowards(
          w.x,
          w.y,
          handoffX,
          handoffY,
          WORKER_WALK_SPEED,
          DT
        );
        w.x = mv.x;
        w.y = mv.y;
        w.moveTime += DT;
        if (mv.arrived && w.currentOrder) {
          inspectQueue.push({
            orderId: w.currentOrder.orderId,
            productId: w.currentOrder.productId,
            arrivedAt: currentTime,
            isReworked: w.currentOrder.isReworked,
          });
          w.currentOrder = null;
          w.state = "IDLE";
          w.thoughtBubble = "Op 40 검사대 인계 완료";
        }
      }
    }

    // 3. Update Inspector (Worker 3 at Op 40 Workbench 3)
    if (inspector.state === "IDLE") {
      if (inspectQueue.length > 0) {
        const nextItem = inspectQueue.shift()!;
        inspector.currentItem = nextItem;
        inspector.state = "INSPECTING_PACKING";
        const spec = products[nextItem.productId];
        // Re-inspection of a reworked item is slightly faster (65% of full inspection)
        inspector.stateTimer = nextItem.isReworked
          ? Math.max(4, Math.round(spec.timings.inspectionPack.seconds * 0.65))
          : spec.timings.inspectionPack.seconds;
        inspector.thoughtBubble = nextItem.isReworked
          ? `🔍 #${nextItem.orderId} 재작업품 재검수 중`
          : `📦 #${nextItem.orderId} (${spec.shortName}) Op 40 전수 검사·포장`;
      } else {
        if (completedCount < totalOrders) {
          inspector.waitPartsOrQueueTime += DT;
          inspector.thoughtBubble = "Op 20/30 물량 도착 대기 (유휴)";
        } else {
          inspector.thoughtBubble = "전체 로트 검수 완료";
        }
      }
    } else if (inspector.state === "INSPECTING_PACKING") {
      inspector.stateTimer -= DT;
      inspector.workTime += DT;
      if (inspector.stateTimer <= 0.01 && inspector.currentItem) {
        const item = inspector.currentItem;
        if (!item.isReworked && reworkTargetOrderIds.has(item.orderId)) {
          // First-Pass Yield Failure -> Route back for Rework!
          reworkTargetOrderIds.delete(item.orderId);
          reworkCount++;
          reworkReturnQueue.push({
            orderId: item.orderId,
            productId: item.productId,
            isReworked: true,
          });
          inspector.currentItem = null;
          inspector.state = "IDLE";
          inspector.thoughtBubble = `⚠️ #${item.orderId} 공차/리크 부적합 → Op 20 재작업 반송!`;
        } else {
          completedCount++;
          completedByProduct[item.productId]++;
          inspector.currentItem = null;
          inspector.state = "IDLE";
          inspector.thoughtBubble = `출하 승인 (${completedCount}/${totalOrders})`;
        }
      }
    }

    // Track queue metrics
    if (inspectQueue.length > 0) {
      inspectQueueWaitTotalSeconds += inspectQueue.length * DT;
    }
    if (inspectQueue.length > maxInspectQueueLength) {
      maxInspectQueueLength = inspectQueue.length;
      peakInspectQueueTime = currentTime;
    }

    const waitingForToolAgents = workers
      .filter((w) => {
        if (w.state !== "WAITING_FOR_TOOL") return false;
        return dist(w.x, w.y, tool1.x - 0.55, tool1.y + (w.id === "worker1" ? -0.35 : 0.35)) <= 0.25;
      })
      .map((w) => w.id);
    if (waitingForToolAgents.length > maxToolWaitQueue) {
      maxToolWaitQueue = waitingForToolAgents.length;
    }
    if (waitingForToolAgents.length > 0) {
      peakToolWaitTime = currentTime;
    }

    // Record snapshot for replay
    const stationQueues: Record<string, StationQueueSnapshot> = {};
    stations.forEach((st) => {
      if (st.id === "tool1") {
        stationQueues[st.id] = {
          stationId: st.id,
          wipCount: (tool1Holder ? 1 : 0) + waitingForToolAgents.length,
          waitingAgentIds: waitingForToolAgents,
          isCongested: waitingForToolAgents.length > 0,
          utilizationRatio: tool1Holder ? 1 : 0,
        };
      } else if (st.id === "tool2") {
        stationQueues[st.id] = {
          stationId: st.id,
          wipCount: tool2Holder ? 1 : 0,
          waitingAgentIds: [],
          isCongested: false,
          utilizationRatio: tool2Holder ? 1 : 0,
        };
      } else if (st.id === "wb3") {
        stationQueues[st.id] = {
          stationId: st.id,
          wipCount: inspectQueue.length + (inspector.currentItem ? 1 : 0),
          waitingAgentIds: [],
          isCongested: inspectQueue.length >= 2,
          utilizationRatio: inspector.currentItem ? 1 : 0,
        };
      } else if (st.id === "wb1" || st.id === "wb2") {
        const w = st.id === "wb1" ? workers[0] : workers[1];
        const isWaitingHere = waitingForToolAgents.includes(w.id);
        stationQueues[st.id] = {
          stationId: st.id,
          wipCount:
            (w.currentOrder ? 1 : 0) + wbDeliveredQueue[st.id].length,
          waitingAgentIds: isWaitingHere ? [w.id] : [],
          isCongested: isWaitingHere || w.state === "CHANGEOVER_SETUP",
          utilizationRatio:
            w.state === "PRE_ASSEMBLING" || w.state === "REWORK_REPAIR"
              ? 1
              : 0.4,
        };
      } else if (st.id === "outBox") {
        stationQueues[st.id] = {
          stationId: st.id,
          wipCount: completedCount,
          waitingAgentIds: [],
          isCongested: false,
          utilizationRatio: completedCount / Math.max(1, totalOrders),
        };
      } else {
        stationQueues[st.id] = {
          stationId: st.id,
          wipCount: 0,
          waitingAgentIds: [],
          isCongested: false,
          utilizationRatio: 0,
        };
      }
    });

    const agentSnapshots: AgentSnapshot[] = [
      ...workers.map((w) => ({
        id: w.id,
        name: w.name,
        role: w.role,
        x: w.x,
        y: w.y,
        state: w.state,
        stateLabel: getKoreanStateLabel(w.state),
        currentProduct: w.currentOrder?.productId,
        currentOrderIndex: w.currentOrder?.orderId,
        holdingTool: w.state === "USING_TOOL" || w.state === "MOVING_TO_TOOL",
        holdingParts:
          w.state === "MOVING_TO_WB" ||
          w.state === "PRE_ASSEMBLING" ||
          w.state === "REWORK_REPAIR" ||
          w.state === "DELIVERING_TO_INSPECT",
        prePickedPartsReady: Boolean(w.prePickedOrder),
        isReworkItem: Boolean(w.currentOrder?.isReworked),
        thoughtBubble: w.thoughtBubble,
        isWaitingBottleneck:
          waitingForToolAgents.includes(w.id) ||
          w.state === "WAITING_FOR_ROBOT_DELIVERY" ||
          w.state === "CHANGEOVER_SETUP",
      })),
      {
        id: inspector.id,
        name: inspector.name,
        role: inspector.role,
        x: inspector.x,
        y: inspector.y,
        state: inspector.state,
        stateLabel:
          inspector.state === "INSPECTING_PACKING"
            ? "Op 40 검사·포장"
            : "검사 대기",
        currentProduct: inspector.currentItem?.productId,
        currentOrderIndex: inspector.currentItem?.orderId,
        holdingTool: false,
        holdingParts: Boolean(inspector.currentItem),
        isReworkItem: Boolean(inspector.currentItem?.isReworked),
        thoughtBubble: inspector.thoughtBubble,
        isWaitingBottleneck: inspectQueue.length >= 3,
      },
    ];

    if (robot) {
      agentSnapshots.push({
        id: robot.id,
        name: robot.name,
        role: robot.role,
        x: robot.x,
        y: robot.y,
        state:
          robot.phase === "IDLE"
            ? "IDLE"
            : robot.phase === "LOADING"
              ? "PICKING_PARTS"
              : "MOVING_TO_WB",
        stateLabel:
          robot.phase === "IDLE"
            ? "이송 대기"
            : robot.phase === "TO_BIN"
              ? "Op 10 이동"
              : robot.phase === "LOADING"
                ? "자재 적재"
                : "Op 20 배달",
        currentProduct: robot.carryingOrder?.productId,
        currentOrderIndex: robot.carryingOrder?.orderId,
        holdingParts: robot.phase === "TO_WB",
        thoughtBubble: robot.thoughtBubble,
        isWaitingBottleneck: false,
      });
    }

    let activeHighlightBanner: string | undefined;
    if (waitingForToolAgents.length > 0 && inspectQueue.length >= 2) {
      activeHighlightBanner = `⚠️ 복합 병목: Op 30 공용 설비 대기(${waitingForToolAgents.length}명) + Op 40 검사대 적체(${inspectQueue.length}개 대기)`;
    } else if (waitingForToolAgents.length > 0) {
      activeHighlightBanner = `🔧 Op 30 공용 설비 병목: ${waitingForToolAgents.map((id) => (id === "worker1" ? "작업자 1" : "작업자 2")).join(", ")} 대기 중`;
    } else if (inspectQueue.length >= 3) {
      activeHighlightBanner = `📦 Op 40 검사대 적체 병목: 미검수 재공품(WIP) ${inspectQueue.length}개 대기 중`;
    }

    timeline.push({
      time: Number(currentTime.toFixed(1)),
      completedCount,
      completedByProduct: { ...completedByProduct },
      agents: agentSnapshots,
      stationQueues,
      toolOccupiedBy: tool1Holder,
      tool2OccupiedBy: tool2Holder,
      inspectQueueItems: inspectQueue.map((item) => ({ ...item })),
      activeHighlightBanner,
    });

    if (completedCount >= totalOrders) {
      break;
    }
    currentTime += DT;
  }

  const totalCompletionTime = Number(currentTime.toFixed(1));
  const toolWaitTotalSeconds = Number(
    (workers[0].waitToolTime + workers[1].waitToolTime).toFixed(1)
  );

  const workerBreakdowns: WorkerTimeBreakdown[] = [
    ...workers.map((w) => ({
      workerId: w.id,
      workerName: w.name,
      workTime: Number(w.workTime.toFixed(1)),
      setupAndReworkTime: Number(w.setupAndReworkTime.toFixed(1)),
      moveTime: Number(w.moveTime.toFixed(1)),
      waitToolTime: Number(w.waitToolTime.toFixed(1)),
      waitPartsOrQueueTime: Number(w.waitPartsOrQueueTime.toFixed(1)),
      prePickSavedTime: Number(w.prePickSavedTime.toFixed(1)),
    })),
    {
      workerId: inspector.id,
      workerName: inspector.name,
      workTime: Number(inspector.workTime.toFixed(1)),
      setupAndReworkTime: 0,
      moveTime: Number(inspector.moveTime.toFixed(1)),
      waitToolTime: 0,
      waitPartsOrQueueTime: Number(inspector.waitPartsOrQueueTime.toFixed(1)),
      prePickSavedTime: 0,
    },
  ];

  const avgWorkTime = Number(
    (
      workerBreakdowns.reduce((acc, w) => acc + w.workTime, 0) /
      workerBreakdowns.length
    ).toFixed(1)
  );
  const avgMoveTime = Number(
    ((workers[0].moveTime + workers[1].moveTime) / 2).toFixed(1)
  );
  const avgWaitTime = Number(
    (
      (toolWaitTotalSeconds + inspectQueueWaitTotalSeconds + changeoverTotalSeconds) /
      3
    ).toFixed(1)
  );

  // Shop-floor IE & ROI Calculations (8-hour shift = 7.5h net operation at 85% OEE availability)
  const bottleneckCycleTimeSec = Number(
    (totalCompletionTime / Math.max(1, completedCount)).toFixed(1)
  );
  const unitsPerHour = Math.max(
    1,
    Math.round((3600 / Math.max(1, bottleneckCycleTimeSec)) * 0.85)
  );
  const shiftOutput8h = Math.round(unitsPerHour * 7.5);
  const teamHourlyUSD = 3 * realism.hourlyLaborRateUSD;
  const teamHourlyKRW = 3 * realism.hourlyLaborRateKRW;
  const laborCostPerUnitUSD = Number((teamHourlyUSD / unitsPerHour).toFixed(2));
  const laborCostPerUnitKRW = Math.round(teamHourlyKRW / unitsPerHour);

  const meta = getScenarioMeta(scenarioId, constraints);

  let paybackMonths: number | null = null;
  if (scenarioId !== "baseline" && baselineReference) {
    const gainedUnitsPerShift = Math.max(
      1,
      shiftOutput8h - baselineReference.shiftOutput8h
    );
    const timeSavedRatio = Math.max(
      0.02,
      (baselineReference.totalCompletionTime - totalCompletionTime) /
        Math.max(1, baselineReference.totalCompletionTime)
    );
    // Direct labor savings + throughput margin contribution per 8-hour shift (22 shifts/month)
    const dailySavingsUSD =
      gainedUnitsPerShift * 1.15 + teamHourlyUSD * 7.5 * timeSavedRatio;
    const monthlySavingsUSD = Math.max(300, dailySavingsUSD * 22);
    paybackMonths = Number((meta.addedCostUSD / monthlySavingsUSD).toFixed(1));
  }

  const { primaryBottleneck, shiftedDesc, insights } = buildGroundedInsights({
    scenarioId,
    policyMode,
    totalCompletionTime,
    avgMoveTime,
    toolWaitTotalSeconds,
    inspectQueueWaitTotalSeconds: Number(inspectQueueWaitTotalSeconds.toFixed(1)),
    maxInspectQueueLength,
    peakToolWaitTime,
    peakInspectQueueTime,
    baselineReference,
  });

  return {
    scenarioId,
    scenarioName: meta.scenarioName,
    questionTested: meta.questionTested,
    badgeText: meta.badgeText,
    policyMode,
    addedCostKRW: meta.addedCostKRW,
    addedCostUSD: meta.addedCostUSD,
    costLabel: meta.costLabel,
    totalOrders,
    completedOrders: completedCount,
    totalCompletionTime,
    throughputPer10Min: Number(
      ((completedCount / Math.max(1, totalCompletionTime)) * 600).toFixed(1)
    ),
    bottleneckCycleTimeSec,
    unitsPerHour,
    shiftOutput8h,
    laborCostPerUnitKRW,
    laborCostPerUnitUSD,
    paybackMonths,
    changeoverTotalSeconds: Number(changeoverTotalSeconds.toFixed(1)),
    reworkCount,
    reworkTotalSeconds: Number(reworkTotalSeconds.toFixed(1)),
    avgWorkTime,
    avgMoveTime,
    avgWaitTime,
    toolWaitTotalSeconds,
    inspectQueueWaitTotalSeconds: Number(inspectQueueWaitTotalSeconds.toFixed(1)),
    maxInspectQueueLength,
    maxToolWaitQueue,
    primaryBottleneckStation: primaryBottleneck,
    shiftedBottleneckDescription: shiftedDesc,
    workerBreakdowns,
    timeline,
    decisionEvents,
    insights,
    layoutStations: stations,
  };
}

function getKoreanStateLabel(state: WorkerActionState): string {
  switch (state) {
    case "IDLE":
      return "대기";
    case "MOVING_TO_BIN":
      return "Op 10 자재 이동";
    case "PICKING_PARTS":
      return "Op 10 키팅";
    case "WAITING_FOR_ROBOT_DELIVERY":
      return "AMR 이송 대기";
    case "MOVING_TO_WB":
      return "Op 20 복귀";
    case "CHANGEOVER_SETUP":
      return "품종 전환 세팅";
    case "PRE_ASSEMBLING":
      return "Op 20 주가공·조립";
    case "REWORK_REPAIR":
      return "불량 재작업";
    case "WAITING_FOR_TOOL":
      return "Op 30 설비 대기";
    case "MOVING_TO_TOOL":
      return "Op 30 설비 진입";
    case "USING_TOOL":
      return "Op 30 설비 가동";
    case "DELIVERING_TO_INSPECT":
      return "Op 40 검사 이송";
    case "WAITING_FOR_INSPECT_QUEUE":
      return "Op 40 적체 대기";
    case "INSPECTING_PACKING":
      return "Op 40 전수 검사";
    case "PRE_PICKING_NEXT":
      return "선행 키팅 (AI)";
  }
}

function getScenarioMeta(
  scenarioId: ScenarioId,
  constraints: ConstraintConfig
): {
  scenarioName: string;
  questionTested: string;
  badgeText: string;
  addedCostKRW: number;
  addedCostUSD: number;
  costLabel: string;
} {
  switch (scenarioId) {
    case "baseline":
      return {
        scenarioName: "현재 배치 (AS-IS 기준)",
        questionTested: "어느 공정(Op 10~40)에서 손실이 가장 큰가?",
        badgeText: "Baseline",
        addedCostKRW: 0,
        addedCostUSD: 0,
        costLabel: "추가 투자 없음 ($0)",
      };
    case "move_bins":
      return {
        scenarioName: "안 1 · 라인사이드 랙 & SMED 지그",
        questionTested: "Op 10 동선과 세팅을 줄이면 출하량이 늘어나는가?",
        badgeText: "Lean 재배치",
        addedCostKRW: constraints.costMoveBinsKRW,
        addedCostUSD: constraints.costMoveBinsUSD,
        costLabel: `$${constraints.costMoveBinsUSD.toLocaleString()} (${(constraints.costMoveBinsKRW / 10000).toFixed(0)}만 원)`,
      };
    case "add_tool":
      return {
        scenarioName: "안 2 · Op 30 병목 설비 2호기 증설",
        questionTested: "Op 30 공용 설비 대기가 핵심 제약(Constraint)인가?",
        badgeText: "병목 설비 증설",
        addedCostKRW: constraints.costAddToolKRW,
        addedCostUSD: constraints.costAddToolUSD,
        costLabel: `$${constraints.costAddToolUSD.toLocaleString()} (${(constraints.costAddToolKRW / 10000).toFixed(0)}만 원)`,
      };
    case "add_robot":
      return {
        scenarioName: "안 3 · 자율주행 이송 로봇 (AMR)",
        questionTested: "자재 이송만 자동화하면 투자비($68k)만큼 빨라지는가?",
        badgeText: "AMR 자동화",
        addedCostKRW: constraints.costAddRobotKRW,
        addedCostUSD: constraints.costAddRobotUSD,
        costLabel: `$${constraints.costAddRobotUSD.toLocaleString()} (${(constraints.costAddRobotKRW / 10000).toFixed(0)}만 원)`,
      };
  }
}

function buildGroundedInsights(params: {
  scenarioId: ScenarioId;
  policyMode: AgentPolicyMode;
  totalCompletionTime: number;
  avgMoveTime: number;
  toolWaitTotalSeconds: number;
  inspectQueueWaitTotalSeconds: number;
  maxInspectQueueLength: number;
  peakToolWaitTime: number;
  peakInspectQueueTime: number;
  baselineReference?: ScenarioSimulationResult;
}): {
  primaryBottleneck: string;
  shiftedDesc: string;
  insights: BottleneckInsight[];
} {
  const {
    scenarioId,
    policyMode,
    totalCompletionTime,
    avgMoveTime,
    toolWaitTotalSeconds,
    inspectQueueWaitTotalSeconds,
    maxInspectQueueLength,
    peakToolWaitTime,
    peakInspectQueueTime,
    baselineReference,
  } = params;

  const insights: BottleneckInsight[] = [];

  if (scenarioId === "baseline") {
    const primaryBottleneck =
      toolWaitTotalSeconds >= 18
        ? "Op 10 원거리 자재 불출 + Op 30 공용 설비 병목 + 품종 전환 세팅"
        : "Op 10 자재 이동 및 Op 40 전수 검사 대기";
    const shiftedDesc =
      "작업자 1·2가 원거리 자재 랙을 왕복하고, 품종 전환 세팅과 Op 30 공용 설비 1대 앞에서 반복 대기함";

    insights.push({
      id: "base-tool",
      severity: "critical",
      title: "Op 30 공용 설비 동시 충돌 및 Op 10 원거리 자재 이동 손실",
      causalSentence: `작업자 1·2가 평균 ${avgMoveTime}초씩 자재 랙 이동에 소모하고도, Op 30 공용 설비 1대 앞에서 총 ${toolWaitTotalSeconds}초 동안 대기했습니다.`,
      evidenceMetrics: `이동 평균 ${avgMoveTime}s · Op 30 대기 ${toolWaitTotalSeconds}s`,
      jumpToTime: Math.max(5, Number((peakToolWaitTime - 4).toFixed(1))),
      jumpEndTime: Number((peakToolWaitTime + 8).toFixed(1)),
      focusStationId: "tool1",
    });

    insights.push({
      id: "base-inspect",
      severity: "warning",
      title: "후반부 Op 40 전수 품질검사대 WIP 집중 및 재작업 반송",
      causalSentence: `초반에는 Op 40 검사원이 대기하다가, 중반 이후 최대 ${maxInspectQueueLength}개의 미검수 재공품(WIP)이 쌓이고 부적합품 재작업 반송이 겹쳤습니다.`,
      evidenceMetrics: `Op 40 최대 WIP ${maxInspectQueueLength}개 · 누적 적체 ${inspectQueueWaitTotalSeconds}s`,
      jumpToTime: Math.max(10, Number((peakInspectQueueTime - 4).toFixed(1))),
      jumpEndTime: Number((peakInspectQueueTime + 8).toFixed(1)),
      focusStationId: "wb3",
    });

    return { primaryBottleneck, shiftedDesc, insights };
  }

  const baseMove = baselineReference?.avgMoveTime ?? 36;
  const baseTotal = baselineReference?.totalCompletionTime ?? 238;
  const baseToolWait = baselineReference?.toolWaitTotalSeconds ?? 34;
  const baseInspectWait = baselineReference?.inspectQueueWaitTotalSeconds ?? 65;

  const moveSavedPct = Math.max(
    0,
    Math.round(((baseMove - avgMoveTime) / Math.max(1, baseMove)) * 100)
  );
  const totalSavedPct = Math.round(
    ((baseTotal - totalCompletionTime) / Math.max(1, baseTotal)) * 100
  );
  const toolWaitDelta = Number((toolWaitTotalSeconds - baseToolWait).toFixed(1));
  const inspectWaitDelta = Number(
    (inspectQueueWaitTotalSeconds - baseInspectWait).toFixed(1)
  );

  if (scenarioId === "move_bins") {
    const primaryBottleneck = "Op 30 공용 설비 대기 급증 → Op 40 검사대 WIP 적체로 전이";
    const shiftedDesc = `Op 10 이동은 ${moveSavedPct}% 단축되었으나, 빨라진 Op 20 작업 때문에 Op 30 설비 대기(${toolWaitDelta >= 0 ? `+${toolWaitDelta}s` : `${toolWaitDelta}s`})와 Op 40 적체가 증가함`;

    insights.push({
      id: "move-shift-tool",
      severity: "critical",
      title: "병목 전이 ①: 단축된 자재 이동 시간이 ‘Op 30 공용 설비 대기’로 전이됨",
      causalSentence: `라인사이드 플로우 랙 배치로 이동 시간을 ${moveSavedPct}% 줄였지만 전체 리드타임은 ${totalSavedPct}%만 단축되었습니다. 두 작업자가 동시에 Op 20을 마치면서 Op 30 공용 설비 대기가 ${toolWaitTotalSeconds}초로 커졌습니다.`,
      evidenceMetrics: `이동 -${moveSavedPct}% 단축 → Op 30 대기 ${toolWaitTotalSeconds}s`,
      jumpToTime: Math.max(5, Number((peakToolWaitTime - 4).toFixed(1))),
      jumpEndTime: Number((peakToolWaitTime + 8).toFixed(1)),
      focusStationId: "tool1",
    });

    insights.push({
      id: "move-shift-inspect",
      severity: "warning",
      title: "병목 전이 ②: 앞단 가속분이 ‘Op 40 전수 검사 대기’로 쌓임",
      causalSentence: `자재 불출 동선을 줄였지만 Op 40 전수 검사 속도 제약 때문에 검사대 앞에 최대 ${maxInspectQueueLength}개의 WIP가 적체되었습니다.`,
      evidenceMetrics: `Op 40 적체 ${inspectQueueWaitTotalSeconds}s · 최대 WIP ${maxInspectQueueLength}개`,
      jumpToTime: Math.max(10, Number((peakInspectQueueTime - 4).toFixed(1))),
      jumpEndTime: Number((peakInspectQueueTime + 8).toFixed(1)),
      focusStationId: "wb3",
    });

    return { primaryBottleneck, shiftedDesc, insights };
  }

  if (scenarioId === "add_tool") {
    const primaryBottleneck = "Op 40 (전수 품질검사·포장) 단독 병목으로 완전 이동";
    const shiftedDesc = `Op 30 설비 대기는 0초로 완전히 해소되었으며, 빨라진 물량이 Op 40 검사대 앞에 최대 ${maxInspectQueueLength}개까지 쌓이며 후공정으로 병목 이동`;

    insights.push({
      id: "tool-solved",
      severity: "positive",
      title: "Op 30 공용 설비 병목 100% 해소 (설비 대기 0초 달성)",
      causalSentence: `Op 30 병목 설비를 2호기로 증설하자 작업자 1·2의 설비 충돌 대기가 ${baseToolWait}초에서 0초로 사라져 전체 완료 시간이 ${totalSavedPct}% 단축되었습니다.`,
      evidenceMetrics: `Op 30 대기 ${baseToolWait}s → 0s · 완료 시간 -${(baseTotal - totalCompletionTime).toFixed(0)}s`,
      jumpToTime: Math.max(8, Number((peakInspectQueueTime - 12).toFixed(1))),
      jumpEndTime: Number((peakInspectQueueTime - 2).toFixed(1)),
      focusStationId: "tool2",
    });

    insights.push({
      id: "tool-shift-inspect",
      severity: "critical",
      title: "신규 제약(Constraint) 도출: Op 40 전수 품질검사대 부하 집중",
      causalSentence: `Op 30에서 막히던 물량이 한꺼번에 넘어오면서 Op 40 검사대 앞에 최대 ${maxInspectQueueLength}개의 재공품(WIP)이 쌓였습니다. 이제 워크셀의 최대 출하량(UPH)은 Op 40 검사 속도에 의해 결정됩니다.`,
      evidenceMetrics: `Op 40 적체 ${inspectQueueWaitTotalSeconds}s (${inspectWaitDelta >= 0 ? `+${inspectWaitDelta}s` : `${inspectWaitDelta}s`}) · 최대 WIP ${maxInspectQueueLength}개`,
      jumpToTime: Math.max(10, Number((peakInspectQueueTime - 4).toFixed(1))),
      jumpEndTime: Number((peakInspectQueueTime + 8).toFixed(1)),
      focusStationId: "wb3",
    });

    return { primaryBottleneck, shiftedDesc, insights };
  }

  // add_robot
  const primaryBottleneck = "Op 30 공용 설비 병목 + Op 40 적체 (고가 AMR 투자 대비 회수 지연)";
  const shiftedDesc = `AMR 로봇이 자재 이송을 전담했으나, Op 30 설비 1대 충돌(${toolWaitTotalSeconds}s)과 Op 40 적체(최대 ${maxInspectQueueLength}개)에 막혀 설비 투자비 대비 단축 효과가 매우 낮음`;

  insights.push({
    id: "robot-shift",
    severity: "critical",
    title: "NIST MEP 과잉자동화 경고: 운반 로봇만으로는 Op 30·40 병목 해결 불가",
    causalSentence: `고가 AMR 도입으로 작업자의 보행 시간은 줄였지만 전체 리드타임은 ${totalSavedPct}%만 단축되었습니다. 절약된 보행 시간이 고스란히 Op 30 설비 대기(${toolWaitTotalSeconds}초)와 Op 40 검사 대기(최대 ${maxInspectQueueLength}개)로 전이되었습니다.`,
    evidenceMetrics: `작업자 이동 ${avgMoveTime}s · Op 30 대기 ${toolWaitTotalSeconds}s`,
    jumpToTime: Math.max(8, Number((peakToolWaitTime - 3).toFixed(1))),
    jumpEndTime: Number((peakToolWaitTime + 7).toFixed(1)),
    focusStationId: "tool1",
  });

  insights.push({
    id: "robot-inspect",
    severity: "warning",
    title: "Op 40 전수 검사 제약으로 인해 AMR 투자 회수 기간 장기화",
    causalSentence: `Op 40 전수 검사는 유자격 검사원 1명만 수행한다는 현장 제약 때문에, 앞단 자재 이송만 자동화해서는 투자 회수 기간이 15개월 이상 소요됩니다.`,
    evidenceMetrics: `Op 40 누적 적체 ${inspectQueueWaitTotalSeconds}s · 최대 WIP ${maxInspectQueueLength}개`,
    jumpToTime: Math.max(12, Number((peakInspectQueueTime - 4).toFixed(1))),
    jumpEndTime: Number((peakInspectQueueTime + 8).toFixed(1)),
    focusStationId: "wb3",
  });

  if (policyMode === "ai_adaptive") {
    insights.unshift({
      id: "ai-policy-effect",
      severity: "positive",
      title: "AI 스마트 작업 지시 효과: 선행 키팅 & 세팅/검사 부하 평준화",
      causalSentence: `Op 30 공용 설비가 사용 중일 때 유휴 대기 대신 다음 로트 자재를 선행 키팅하고, 품종 전환 세팅과 Op 40 검사 부하를 고려해 투입 순서를 최적화했습니다.`,
      evidenceMetrics: `자율 스케줄링 및 선행 키팅 적용`,
      jumpToTime: 18,
      jumpEndTime: 32,
      focusStationId: "wb1",
    });
  }

  return { primaryBottleneck, shiftedDesc, insights };
}

export function runAllFourScenarios(params: {
  policyMode: AgentPolicyMode;
  baseStations: StationNode[];
  products: Record<ProductId, ProductSpec>;
  constraints: ConstraintConfig;
  realism?: ProcessRealismConfig;
}): Record<ScenarioId, ScenarioSimulationResult> {
  const baseline = runScenarioSimulation({
    scenarioId: "baseline",
    policyMode: params.policyMode,
    baseStations: params.baseStations,
    products: params.products,
    constraints: params.constraints,
    realism: params.realism,
  });

  const move_bins = runScenarioSimulation({
    scenarioId: "move_bins",
    policyMode: params.policyMode,
    baseStations: params.baseStations,
    products: params.products,
    constraints: params.constraints,
    realism: params.realism,
    baselineReference: baseline,
  });

  const add_tool = runScenarioSimulation({
    scenarioId: "add_tool",
    policyMode: params.policyMode,
    baseStations: params.baseStations,
    products: params.products,
    constraints: params.constraints,
    realism: params.realism,
    baselineReference: baseline,
  });

  const add_robot = runScenarioSimulation({
    scenarioId: "add_robot",
    policyMode: params.policyMode,
    baseStations: params.baseStations,
    products: params.products,
    constraints: params.constraints,
    realism: params.realism,
    baselineReference: baseline,
  });

  return {
    baseline,
    move_bins,
    add_tool,
    add_robot,
  };
}
