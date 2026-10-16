import { LocaleMessages } from "./ko";

export const en: LocaleMessages = {
  meta: {
    langName: "English",
    appTitle: "WorkCell Twin · Shop-Floor Simulator",
    appSubtitle:
      "See what increases your daily output the most before buying new equipment",
  },
  nav: {
    step1: "1. Customize Shop",
    step2: "2. Compare Options",
    step3: "3. Field Validation",
  },
  industryBar: {
    badge: "Industry",
    customHint: "Top 4 US SME Manufacturing Templates",
  },
  industries: {
    cnc_metal_shop: {
      tabTitle: "⚙️ CNC & Metal Shop",
      usRankBadge: "#1 US SME (19%)",
      cellTitle: "CNC Machining · Ultrasonic Cleaning · CMM Inspection",
      cellSummary:
        "Parts machined on two CNC mills share a single ultrasonic cleaner and a fixed CMM inspection table.",
      stepLabels: {
        pickHandling: "① Fetch Raw Billet",
        preAssembly: "② CNC Milling",
        toolWork: "③ Shared Ultrasonic Wash",
        inspectionPack: "④ CMM Check & Pack",
      },
      stationNames: {
        binA: "Aluminum Rack",
        binB: "Stainless Rack",
        wb1: "CNC Mill #1",
        wb2: "CNC Mill #2",
        tool1: "Shared Washer #1",
        tool2: "Shared Washer #2",
        wb3: "CMM Check & Pack",
        robotDock: "Delivery Robot",
        outBox: "Outbox Pallet",
      },
      products: {
        productA: {
          partNumber: "PN-4020",
          name: "Hydraulic Manifold (PN-4020)",
          shortName: "Manifold Block",
          tag: "Long ultrasonic wash",
          opNotes: {
            pickHandling: "Pick aluminum billet",
            preAssembly: "CNC pocket milling",
            toolWork: "Ultrasonic wash & deburr",
            inspectionPack: "Gauge check & pack",
          },
        },
        productB: {
          partNumber: "PN-7190",
          name: "Precision Valve Body (PN-7190)",
          shortName: "Valve Body",
          tag: "Long CMM inspection",
          opNotes: {
            pickHandling: "Pick stainless forging",
            preAssembly: "Precision boring",
            toolWork: "Ultrasonic rinse",
            inspectionPack: "CMM precision check",
          },
        },
      },
      scenarios: {
        baseline: {
          costPill: "Current · $0",
          title: "Current Shop",
          question: "Baseline (Racks far away · 1 shared washer)",
          shortBottleneck: "Long walk + queue at 1 shared washer",
        },
        move_bins: {
          costPill: "+$2,400",
          title: "Move Racks Closer",
          question: "Place material racks right next to CNC mills",
          shortBottleneck: "Less walking, but worse queue at shared washer",
        },
        add_tool: {
          costPill: "+$14,500",
          title: "Add 2nd Washer",
          question: "Add a second shared ultrasonic washer",
          shortBottleneck: "Washer queue eliminated! (Best ROI)",
        },
        add_robot: {
          costPill: "+$68,000",
          title: "Add Delivery Robot",
          question: "Use an AMR robot to deliver billets to CNCs",
          shortBottleneck: "Fast delivery, but still blocked by 1 washer & CMM",
        },
      },
      constraintDefault:
        "Keep 3 workers. The CMM table is fixed to granite and operated only by Inspector #3.",
    },

    food_copacking: {
      tabTitle: "🥫 Food & Packaging",
      usRankBadge: "#2 US SME (11%)",
      cellTitle: "Beverage & Pouch Co-Packing · X-Ray Checkweigh Line",
      cellSummary:
        "Two prep tables share one servo filler/sealer and one fixed X-Ray checkweigher line.",
      stepLabels: {
        pickHandling: "① Fetch Bottles/Pouches",
        preAssembly: "② Prep & Align",
        toolWork: "③ Shared Servo Filler",
        inspectionPack: "④ X-Ray Check & Box",
      },
      stationNames: {
        binA: "Bottle Rack",
        binB: "Pouch Rack",
        wb1: "Liquid Prep #1",
        wb2: "Powder Prep #2",
        tool1: "Shared Filler #1",
        tool2: "Shared Filler #2",
        wb3: "X-Ray & Pack",
        robotDock: "Delivery Robot",
        outBox: "Outbox Pallet",
      },
      products: {
        productA: {
          partNumber: "SKU-CB12",
          name: "Cold Brew 12-Pack (SKU-CB12)",
          shortName: "Cold Brew Pack",
          tag: "Long filling & N2 seal",
          opNotes: {
            pickHandling: "Fetch bottles",
            preAssembly: "Align 12-pack tray",
            toolWork: "Servo fill & N2 seal",
            inspectionPack: "Weight check & box",
          },
        },
        productB: {
          partNumber: "SKU-WP32",
          name: "Protein Pouch 2lb (SKU-WP32)",
          shortName: "Protein Pouch",
          tag: "Long X-Ray & allergen check",
          opNotes: {
            pickHandling: "Fetch powder & pouches",
            preAssembly: "Sieve & open pouch",
            toolWork: "Auger fill & heat seal",
            inspectionPack: "X-Ray & checkweigh",
          },
        },
      },
      scenarios: {
        baseline: {
          costPill: "Current · $0",
          title: "Current Shop",
          question: "Baseline (Racks far away · 1 shared filler)",
          shortBottleneck: "Long walk + queue at 1 shared filler",
        },
        move_bins: {
          costPill: "+$3,200",
          title: "Move Racks Closer",
          question: "Place packaging racks right next to prep tables",
          shortBottleneck: "Less walking, but queued at the single filler",
        },
        add_tool: {
          costPill: "+$18,500",
          title: "Add 2nd Filler",
          question: "Add a second servo filler/sealer unit",
          shortBottleneck: "Filler wait eliminated! (Best ROI)",
        },
        add_robot: {
          costPill: "+$72,000",
          title: "Add Delivery Robot",
          question: "Use an AMR robot to deliver bottles & pouches",
          shortBottleneck: "Fast delivery, but blocked by 1 filler & X-Ray",
        },
      },
      constraintDefault:
        "Keep 3 workers. The X-Ray checkweigher conveyor is fixed and run only by Inspector #3.",
    },

    medical_device: {
      tabTitle: "🧪 Medical Device",
      usRankBadge: "#3 US SME (8.3%)",
      cellTitle: "Cleanroom Catheter UV Bonding & Leak Test Cell",
      cellSummary:
        "Two microscope assembly stations share one UV curing chamber and one fixed leak tester.",
      stepLabels: {
        pickHandling: "① Fetch Sterile Kit",
        preAssembly: "② Microscope Bonding",
        toolWork: "③ Shared UV Cure Chamber",
        inspectionPack: "④ Leak Test & Seal",
      },
      stationNames: {
        binA: "Catheter Rack",
        binB: "Manifold Rack",
        wb1: "Bonding Bench #1",
        wb2: "Bonding Bench #2",
        tool1: "UV Chamber #1",
        tool2: "UV Chamber #2",
        wb3: "Leak Test & Seal",
        robotDock: "Cleanroom Robot",
        outBox: "Outbox Pallet",
      },
      products: {
        productA: {
          partNumber: "MD-104",
          name: "Single-Lumen Catheter (MD-104)",
          shortName: "Single Catheter",
          tag: "Long UV cure time",
          opNotes: {
            pickHandling: "Fetch sterile tubing",
            preAssembly: "Apply UV adhesive",
            toolWork: "UV chamber cure",
            inspectionPack: "Leak test & pouch seal",
          },
        },
        productB: {
          partNumber: "MD-309",
          name: "Triple-Lumen CVC Kit (MD-309)",
          shortName: "Triple CVC Kit",
          tag: "Long 3-port leak test",
          opNotes: {
            pickHandling: "Fetch 3-lumen kit",
            preAssembly: "Microscope port alignment",
            toolWork: "UV spot tacking",
            inspectionPack: "3-port pressure leak test",
          },
        },
      },
      scenarios: {
        baseline: {
          costPill: "Current · $0",
          title: "Current Shop",
          question: "Baseline (Racks far away · 1 UV chamber)",
          shortBottleneck: "Long walk + queue at 1 UV chamber",
        },
        move_bins: {
          costPill: "+$2,100",
          title: "Move Racks Closer",
          question: "Place sterile trays right next to bonding benches",
          shortBottleneck: "Less walking, but queued at 1 UV chamber",
        },
        add_tool: {
          costPill: "+$15,200",
          title: "Add 2nd UV Chamber",
          question: "Add a second UV curing chamber",
          shortBottleneck: "UV cure wait eliminated! (Best ROI)",
        },
        add_robot: {
          costPill: "+$75,000",
          title: "Add Cleanroom Robot",
          question: "Use a cleanroom AMR to deliver sterile trays",
          shortBottleneck: "Fast delivery, but blocked by UV chamber & leak test",
        },
      },
      constraintDefault:
        "Keep 3 workers. The leak tester is FDA-validated in place and operated only by Inspector #3.",
    },

    pcb_box_build: {
      tabTitle: "🔌 Electronics & PCB",
      usRankBadge: "#4 US SME (11.6%)",
      cellTitle: "Industrial Control Box-Build · Circuit & Hi-Pot Test",
      cellSummary:
        "Two assembly benches share one circuit/firmware tester and one fixed high-voltage Hi-Pot bench.",
      stepLabels: {
        pickHandling: "① Fetch PCB & Parts",
        preAssembly: "② Heatsink & Wiring",
        toolWork: "③ Shared Circuit Tester",
        inspectionPack: "④ Hi-Pot Safety Test",
      },
      stationNames: {
        binA: "PCB Tote Rack",
        binB: "Busbar Rack",
        wb1: "Assembly Bench #1",
        wb2: "Assembly Bench #2",
        tool1: "Circuit Tester #1",
        tool2: "Circuit Tester #2",
        wb3: "Hi-Pot & Pack",
        robotDock: "Delivery Robot",
        outBox: "Outbox Pallet",
      },
      products: {
        productA: {
          partNumber: "EMS-204",
          name: "PLC Remote I/O Module (EMS-204)",
          shortName: "PLC Module",
          tag: "Long firmware & circuit test",
          opNotes: {
            pickHandling: "Fetch PCB & heatsink",
            preAssembly: "Torque screws",
            toolWork: "Flash firmware & circuit test",
            inspectionPack: "Coat check & ESD pack",
          },
        },
        productB: {
          partNumber: "EMS-880",
          name: "VFD Motor Drive Box (EMS-880)",
          shortName: "VFD Drive Box",
          tag: "Long 1500V Hi-Pot test",
          opNotes: {
            pickHandling: "Fetch busbars & harness",
            preAssembly: "Terminal wiring",
            toolWork: "24V power-on check",
            inspectionPack: "1500V Hi-Pot safety test",
          },
        },
      },
      scenarios: {
        baseline: {
          costPill: "Current · $0",
          title: "Current Shop",
          question: "Baseline (Racks far away · 1 circuit tester)",
          shortBottleneck: "Long walk + queue at 1 circuit tester",
        },
        move_bins: {
          costPill: "+$1,800",
          title: "Move Racks Closer",
          question: "Place ESD racks right next to assembly benches",
          shortBottleneck: "Less walking, but queued at 1 circuit tester",
        },
        add_tool: {
          costPill: "+$12,500",
          title: "Add 2nd Tester",
          question: "Add a second shared circuit/firmware tester",
          shortBottleneck: "Tester wait eliminated! (Best ROI)",
        },
        add_robot: {
          costPill: "+$65,000",
          title: "Add Delivery Robot",
          question: "Use an AMR robot to deliver ESD totes",
          shortBottleneck: "Fast delivery, but blocked by tester & Hi-Pot",
        },
      },
      constraintDefault:
        "Keep 3 workers. The Hi-Pot safety bench is fixed inside a safety cage and operated only by Inspector #3.",
    },
  },
  step1: {
    badge: "Custom Shop Setup",
    title: "Adjust your floor layout and task times",
    subtitle: "Drag equipment with your mouse or change numbers to update the simulation.",
    layoutTitle: "① Shop Floorplan (Drag equipment with your mouse)",
    layoutDesc: "Drag material racks or workbenches. (The final inspection table is fixed.)",
    resetLayoutBtn: "Reset Layout",
    canvasDragBadge: "Drag stations to rearrange",
    realismTitle: "② Real Shop Losses (Setup Time & Defect Rework)",
    realismDesc: "Set the changeover delay when switching products and the defect rework rate.",
    changeoverLabel: "🔄 Product Switch Setup Time",
    changeoverOptions: {
      s0: "None (0s)",
      s8: "Normal (6s)",
      s14: "Long (12s)",
    },
    reworkLabel: "⚠️ Defect Rework Rate",
    reworkOptions: {
      r0: "None (0%)",
      r15: "Normal (15%)",
      r25: "High (25%)",
    },
    orderTimeTitle: "② Order Quantities & Step Times (seconds)",
    orderTimeDesc: "Changing any number immediately updates daily output and bottlenecks.",
    presetStandardBtn: "Normal Order (5 A + 5 B)",
    presetUrgentBtn: "Urgent Order (8 Inspection-Heavy B)",
    orderCountLabel: "Qty",
    unitCount: "ea",
    sourceAssumed: "Est.",
    sourceMeasured: "Measured",
    secondsTakes: "sec",
    constraintTitle: "④ Fixed Shop Rule",
    reparseBtn: "Apply",
    parsingBtn: "Applying...",
    systemConfirmPrefix: "Applied:",
    defaultSystemConfirm:
      "Balanced mix of 5 Product A and 5 Product B with product switch setup and rework loops active.",
    urgentSystemConfirm:
      "Urgent Order Applied: Inspection-heavy Product B jumped to 8 units, creating a queue at final inspection.",
    goCompareBtn: "Compare the 4 Improvement Options",
  },
  step2: {
    orderSummary: (partA: string, countA: number, partB: string, countB: number) =>
      `Test Run: ${countA}× ${partA} + ${countB}× ${partB} (${countA + countB} units total)`,
    heroTitle: "Which change gives you the highest daily output?",
    heroSubtitle: "Click any card below to compare completion time, 8-hour daily output, and payback period.",
    selectedBadge: "Selected",
    totalTimeLabel: (totalOrders: number) => `Time for ${totalOrders} units`,
    unitSeconds: "s",
    fasterBy: (sec: number) => `${sec}s faster`,
    almostSame: "Minimal gain",
    whereBlockedTitle: "Bottleneck:",
    metrics: {
      shiftOutputLabel: "Daily (8h) Output",
      shiftOutputUnit: "pcs",
      uphLabel: "Units / Hour",
      uphUnit: "UPH",
      laborCostLabel: "Labor / Unit",
      paybackLabel: "Payback Period",
      paybackImmediate: "Immediate ($0)",
      paybackMonths: (m: number) => `~${m} mo`,
      paybackNever: "No payback",
      setupAndReworkLabel: "Setup & Rework",
      setupAndReworkValue: (setupSec: number, reworkCnt: number) =>
        `${setupSec}s setup · ${reworkCnt} rework`,
    },
    player: {
      pauseBtn: "Pause",
      playBtn: "Play Simulation",
      restartBtn: "Restart",
      view2D: "2D Floorplan",
      view3D: "3D View",
      singleViewBtn: "Single View",
      multiViewBtn: "Compare All 4",
      closeHighlight: "Close",
      jumpBanner: (sec: number) => `At ${sec}s: Peak queue and waiting occurs here.`,
      timeScrubberLabel: (sec: number) => `${sec}s`,
      completedStatus: (done: number, total: number) => `Done ${done} / ${total}`,
    },
    whySection: {
      title: "Why did this happen?",
      subtitle: "Click a card to jump directly to the bottleneck moment in the player.",
      watchMomentBtn: "▶ Watch Moment",
    },
    policyBox: {
      title: "Zero-Cost Improvement: Change Worker Scheduling",
      desc: "Instead of standing idle when shared equipment is busy, workers pre-fetch the next part and batch identical products to cut setup time.",
      fixedTitle: "① Standard Way (Wait in line)",
      fixedDesc: "Stand idle when shared equipment is busy",
      aiTitle: "② AI Smart Scheduling (Recommended)",
      aiDesc: "Pre-fetch next part while waiting + batch same products",
    },
  },
  step3: {
    pollBadge: "Decision Check",
    pollTitle: "Which option would you invest in?",
    pollSubtitle: "Compare gut intuition against the physics simulation results.",
    pickedBadge: "Selected",
    resultLabel: "Completion Time:",
    savedLabel: (sec: number) => `(${sec}s saved)`,
    validationTitle: "Stopwatch Field Verification",
    validationDesc: "Comparing simulated predictions against real human stopwatch trials.",
    matchedBadge: "Verified Match",
    predictedTimeLabel: "Simulator Prediction",
    actualTimeLabel: "Stopwatch Actual",
    actualObservationPrefix: "Field Note:",
  },
  canvas: {
    walkTimeApprox: (sec: number) => `~${sec}s walk`,
    fixedSubLabel: "Fixed",
    draggableSubLabel: "Draggable",
    sharedToolSubLabel: "Shared",
    queuedItemsBadge: (count: number) => `${count} waiting`,
    progressOverlay: (sec: number, done: number) => `${sec}s · ${done} done`,
    rotate3DLabel: "Drag to rotate",
    stationNames: {
      binA: "Material Rack A",
      binB: "Material Rack B",
      wb1: "Station #1",
      wb2: "Station #2",
      tool1: "Shared Tool #1",
      tool2: "Shared Tool #2",
      wb3: "Final Check & Pack",
      robotDock: "Delivery Robot",
      outBox: "Outbox",
    },
    agentTags: {
      worker1: "W1",
      worker2: "W2",
      worker3: "QC3",
      robot1: "AMR",
    },
    bubbles: {
      waitingTool: "⏳ Waiting for equipment!",
      prePicking: "⚡ Pre-fetching next part!",
      changeover: "🔄 Switching fixture setup",
      rework: "🛠️ Reworking defect!",
      assembling: "Working",
      usingTool: "Using shared equipment",
      inspecting: "Inspecting & packing",
      movingToBin: "Fetching material",
      movingToWb: "Returning to station",
      delivering: "Delivering to QC",
      robotDelivering: "Robot delivering",
      idle: "Idle",
    },
    banners: {
      bothCongested: (toolWaiters: number, inspectWip: number) =>
        `⚠️ Equipment wait (${toolWaiters}) + ${inspectWip} items queued at QC!`,
      toolCongested: "⚠️ Workers are waiting in line for 1 shared machine!",
      inspectCongested: (inspectWip: number) =>
        `⚠️ ${inspectWip} items are piled up waiting for final inspection!`,
    },
  },
  insights: {
    baseline: {
      t1Title: "Long walks to material racks + waiting at shared equipment",
      t1Sentence: (avgMove: number, toolWait: number, setupSec: number) =>
        `Workers spent ${avgMove}s walking to racks, waited ${toolWait}s at the single shared machine, and lost ${setupSec}s switching setups.`,
      t2Title: "Items pile up at Final Inspection + defect rework",
      t2Sentence: (maxQueue: number, reworkCount: number) =>
        `Up to ${maxQueue} items queued at final inspection, with ${reworkCount} items sent back for rework.`,
    },
    move_bins: {
      t1Title: "Walking dropped, but waiting at shared equipment got worse",
      t1Sentence: (moveSavedPct: number, totalSavedPct: number, toolWait: number) =>
        `Walking dropped by ${moveSavedPct}%, yet total time improved by only ${totalSavedPct}% because both workers collided at the single shared machine (${toolWait}s wait).`,
      t2Title: "Saved walking time turned into inspection queue waiting",
      t2Sentence: (maxQueue: number) =>
        `Speeding up material fetching without adding machine capacity pushed ${maxQueue} items into the final inspection queue.`,
    },
    add_tool: {
      t1Title: "Adding a 2nd shared machine cut equipment wait to 0s! (Best ROI)",
      t1Sentence: (baseToolWait: number, totalSavedPct: number, shiftDiff: number) =>
        `Duplicating the bottleneck machine eliminated ${baseToolWait}s of waiting, cutting total time by ${totalSavedPct}% and adding +${shiftDiff} units/day.`,
      t2Title: "Final Inspection now sets the pace for the shop",
      t2Sentence: (maxQueue: number) =>
        `With the mid-process bottleneck solved, up to ${maxQueue} items queue at final inspection—making this the highest-ROI upgrade.`,
    },
    add_robot: {
      t1Title: "Expensive robot still gets blocked by 1 shared machine & QC",
      t1Sentence: (totalSavedPct: number, toolWait: number, paybackMonths: number) =>
        `The robot automated material delivery, but total time dropped only ${totalSavedPct}% due to ${toolWait}s of machine waiting—taking ${paybackMonths}+ months to pay back.`,
      t2Title: "Buying an AMR robot before fixing machine bottlenecks is overkill",
      t2Sentence: (inspectWait: number) =>
        `Workers are bottlenecked by shared equipment and ${inspectWait}s of inspection queuing, not walking.`,
    },
    aiPolicy: {
      title: "AI Smart Scheduling: Less setup time + pre-fetching while waiting",
      sentence: (setupSec: number) =>
        `Batching identical products reduced setup loss to ${setupSec}s, and pre-fetching parts during machine contention saved time at $0 cost.`,
    },
  },
  validationNotes: {
    baseline: "Workers collide at the single shared machine; rework interrupts flow",
    move_bins: "Faster fetching causes immediate queuing in front of the single shared machine",
    add_tool: "Equipment waiting drops to zero and daily output jumps the most",
    add_robot: "Robot delivers parts, but workers still wait at the single machine and QC",
  },
};
