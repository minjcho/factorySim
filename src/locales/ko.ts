export const ko = {
  meta: {
    langName: "한국어",
    appTitle: "우리 작업장 개선 시험기",
    appSubtitle: "설비를 사기 전에 무엇이 하루 생산량을 가장 많이 늘리는지 눈으로 확인하세요",
  },
  nav: {
    step1: "1. 내 공장 맞추기",
    step2: "2. 개선 효과 비교",
    step3: "3. 현장 실측 검증",
  },
  industryBar: {
    badge: "업종 선택",
    customHint: "미국 중소공장 상위 4대 업종 표준 데이터",
  },
  industries: {
    cnc_metal_shop: {
      tabTitle: "⚙️ 금속·CNC 가공",
      usRankBadge: "미국 중소공장 1위 (19%)",
      cellTitle: "CNC 밀링 가공 · 초음파 세척 · 3차원 측정 작업장",
      cellSummary:
        "CNC 가공 후 1대뿐인 공용 초음파 세척기와 고정된 3차원 측정기(CMM)에서 줄서기가 발생하는 대표적인 금속 가공 현장입니다.",
      stepLabels: {
        pickHandling: "① 원자재 가져오기",
        preAssembly: "② CNC 밀링·선반 가공",
        toolWork: "③ 공용 초음파 세척·디버링",
        inspectionPack: "④ 3차원 측정·출하 포장",
      },
      stationNames: {
        binA: "알루미늄 자재대",
        binB: "스텐 자재대",
        wb1: "CNC 밀링 #1",
        wb2: "CNC 가공기 #2",
        tool1: "공용 세척기 #1",
        tool2: "공용 세척기 #2",
        wb3: "3차원 측정·포장",
        robotDock: "자율 운반 로봇",
        outBox: "출하 팔레트",
      },
      products: {
        productA: {
          partNumber: "PN-4020",
          name: "유압 매니폴드 블록 (PN-4020)",
          shortName: "유압 블록",
          tag: "공용 세척기 오래 사용",
          opNotes: {
            pickHandling: "알루미늄 소재 수령",
            preAssembly: "CNC 밀링 홀 가공",
            toolWork: "초음파 세척 및 버(Burr) 제거",
            inspectionPack: "게이지 검사 및 포장",
          },
        },
        productB: {
          partNumber: "PN-7190",
          name: "정밀 밸브 하우징 (PN-7190)",
          shortName: "밸브 하우징",
          tag: "3차원 정밀 측정 오래 걸림",
          opNotes: {
            pickHandling: "스테인리스 소재 수령",
            preAssembly: "정밀 보링 가공",
            toolWork: "초음파 린스 세척",
            inspectionPack: "3차원 측정기 정밀 검사",
          },
        },
      },
      scenarios: {
        baseline: {
          costPill: "현재 상태 · 0원",
          title: "현재 작업장",
          question: "기본 상태 (자재대 멀리 있음 · 세척기 1대)",
          shortBottleneck: "자재 이동 + 세척기 1대 앞 줄서기",
        },
        move_bins: {
          costPill: "+320만 원 ($2.4k)",
          title: "자재대 가까이 배치",
          question: "자재대를 CNC 바로 옆으로 붙이고 퀵클램프 적용",
          shortBottleneck: "걸음은 줄었지만 세척기 앞 줄서기 지속",
        },
        add_tool: {
          costPill: "+1,950만 원 ($14.5k)",
          title: "공용 세척기 1대 추가",
          question: "줄 서서 기다리던 초음파 세척기를 2대로 증설",
          shortBottleneck: "세척기 대기 완전 해결! (가장 추천)",
        },
        add_robot: {
          costPill: "+9,100만 원 ($68k)",
          title: "자율 운반 로봇 도입",
          question: "고가 로봇이 원자재를 CNC까지 자동 배달",
          shortBottleneck: "운반만 빨라질 뿐 세척기에서 다시 막힘",
        },
      },
      constraintDefault:
        "작업자 3명 유지. 3차원 측정기(CMM)는 정반 고정 설비라 이동 불가하며 검사 담당자(3번)만 사용.",
    },

    food_copacking: {
      tabTitle: "🥫 식품·포장 라인",
      usRankBadge: "미국 중소공장 2위 (11%)",
      cellTitle: "음료 · 파우치 위탁 충진 및 X-Ray 검수 라인",
      cellSummary:
        "1대뿐인 공용 서보 충진·실링기와 컨베이어에 고정된 X-Ray 중량 검수대에서 대기가 발생하는 식품 포장 현장입니다.",
      stepLabels: {
        pickHandling: "① 원료·포장재 가져오기",
        preAssembly: "② 배합·용기 정렬",
        toolWork: "③ 공용 충진·질소 실링",
        inspectionPack: "④ X-Ray·중량 검사·박스포장",
      },
      stationNames: {
        binA: "음료병 자재대",
        binB: "파우치 자재대",
        wb1: "배합·정렬대 #1",
        wb2: "분말 준비대 #2",
        tool1: "공용 충진기 #1",
        tool2: "공용 충진기 #2",
        wb3: "X-Ray·중량 검사",
        robotDock: "자율 운반 로봇",
        outBox: "출하 팔레트",
      },
      products: {
        productA: {
          partNumber: "SKU-CB12",
          name: "유기농 콜드브루 12팩 (SKU-CB12)",
          shortName: "콜드브루 12팩",
          tag: "충진·질소 실링 오래 걸림",
          opNotes: {
            pickHandling: "살균 공병 수령",
            preAssembly: "원액 준비 및 트레이 정렬",
            toolWork: "정량 충진 및 질소 캡핑",
            inspectionPack: "중량 확인 및 박스 포장",
          },
        },
        productB: {
          partNumber: "SKU-WP32",
          name: "단백질 파우치 2lb (SKU-WP32)",
          shortName: "단백질 파우치",
          tag: "X-Ray·알레르기 검수 오래 걸림",
          opNotes: {
            pickHandling: "파우더 및 지퍼백 수령",
            preAssembly: "분말 체질 및 파우치 세팅",
            toolWork: "분말 충진 및 열실링",
            inspectionPack: "X-Ray 이물·중량 전수 검사",
          },
        },
      },
      scenarios: {
        baseline: {
          costPill: "현재 상태 · 0원",
          title: "현재 작업장",
          question: "기본 상태 (포장재 멀리 있음 · 충진기 1대)",
          shortBottleneck: "포장재 이동 + 충진기 1대 앞 줄서기",
        },
        move_bins: {
          costPill: "+430만 원 ($3.2k)",
          title: "자재대 가까이 배치",
          question: "포장재 랙을 작업대 바로 옆으로 밀착 배치",
          shortBottleneck: "이동은 줄었지만 충진기 앞 줄서기 지속",
        },
        add_tool: {
          costPill: "+2,480만 원 ($18.5k)",
          title: "공용 충진기 1대 추가",
          question: "병목이던 서보 충진·실링기를 2대로 증설",
          shortBottleneck: "충진기 대기 완전 해결! (가장 추천)",
        },
        add_robot: {
          costPill: "+9,600만 원 ($72k)",
          title: "자율 운반 로봇 도입",
          question: "고가 로봇이 공병·파우치를 자동 배달",
          shortBottleneck: "운반만 빨라질 뿐 충진기에서 다시 막힘",
        },
      },
      constraintDefault:
        "작업자 3명 유지. X-Ray·중량선별 라인은 고정 설비라 이동 불가하며 검수 담당자(3번)만 운영.",
    },

    medical_device: {
      tabTitle: "🧪 의료기기 조립",
      usRankBadge: "미국 중소공장 3위 (8.3%)",
      cellTitle: "의료용 카테터 클린룸 접착 · 리크 테스트 작업장",
      cellSummary:
        "현미경 조립 후 1대뿐인 공용 UV 광경화기와 고정 설비인 공압 리크(누출) 시험기에서 줄서기가 발생하는 클린룸 현장입니다.",
      stepLabels: {
        pickHandling: "① 멸균 부품 가져오기",
        preAssembly: "② 현미경 접착·조립",
        toolWork: "③ 공용 UV 광경화 챔버",
        inspectionPack: "④ 공압 리크 시험·멸균포장",
      },
      stationNames: {
        binA: "카테터 자재대",
        binB: "매니폴드 자재대",
        wb1: "현미경 조립 #1",
        wb2: "현미경 조립 #2",
        tool1: "UV 경화기 #1",
        tool2: "UV 경화기 #2",
        wb3: "리크 시험·포장",
        robotDock: "클린룸 운반 로봇",
        outBox: "출하 보관대",
      },
      products: {
        productA: {
          partNumber: "MD-104",
          name: "단일 루멘 정맥 카테터 (MD-104)",
          shortName: "단루멘 카테터",
          tag: "UV 광경화 챔버 오래 사용",
          opNotes: {
            pickHandling: "튜브·허브 부품 수령",
            preAssembly: "의료용 UV 접착제 도포",
            toolWork: "UV 광경화 챔버 조사",
            inspectionPack: "단채널 리크 시험 및 실링",
          },
        },
        productB: {
          partNumber: "MD-309",
          name: "3루멘 중심정맥 키트 (MD-309)",
          shortName: "3루멘 카테터",
          tag: "3채널 정밀 리크 시험 오래 걸림",
          opNotes: {
            pickHandling: "3루멘 튜브·클램프 수령",
            preAssembly: "현미경 3포트 정밀 결합",
            toolWork: "UV 스팟 가경화",
            inspectionPack: "3채널 순차 공압 리크 시험",
          },
        },
      },
      scenarios: {
        baseline: {
          costPill: "현재 상태 · 0원",
          title: "현재 작업장",
          question: "기본 상태 (부품대 멀리 있음 · UV 경화기 1대)",
          shortBottleneck: "부품 이동 + UV 경화기 1대 앞 줄서기",
        },
        move_bins: {
          costPill: "+280만 원 ($2.1k)",
          title: "자재대 가까이 배치",
          question: "멸균 부품 트레이를 조립대 바로 옆으로 배치",
          shortBottleneck: "걸음은 줄었지만 UV 경화기 앞 대기 지속",
        },
        add_tool: {
          costPill: "+2,050만 원 ($15.2k)",
          title: "UV 경화기 1대 추가",
          question: "공용 UV 광경화 챔버를 2대로 증설",
          shortBottleneck: "UV 경화 대기 완전 해결! (가장 추천)",
        },
        add_robot: {
          costPill: "+1억 100만 원 ($75k)",
          title: "클린룸 로봇 도입",
          question: "고가 클린룸 로봇이 멸균 트레이를 자동 운반",
          shortBottleneck: "운반만 빨라질 뿐 UV 경화기에서 막힘",
        },
      },
      constraintDefault:
        "작업자 3명 유지. 공압 리크 시험기는 인증 고정 설비라 이동 불가하며 품질 담당자(3번)만 승인.",
    },

    pcb_box_build: {
      tabTitle: "🔌 전자·제어반 조립",
      usRankBadge: "미국 중소공장 4위 (11.6%)",
      cellTitle: "산업용 제어 모듈 조립 · 회로 시험 · 내전압 검사장",
      cellSummary:
        "조립 후 1대뿐인 공용 회로 시험기(ICT/FCT)와 안전 펜스에 고정된 내전압 시험대에서 병목이 발생하는 전자 조립 현장입니다.",
      stepLabels: {
        pickHandling: "① 보드·부품 가져오기",
        preAssembly: "② 방열판·배선 조립",
        toolWork: "③ 공용 회로·펌웨어 시험기",
        inspectionPack: "④ 내전압 안전검사·포장",
      },
      stationNames: {
        binA: "제어보드 자재대",
        binB: "인버터 자재대",
        wb1: "전장 조립대 #1",
        wb2: "전장 조립대 #2",
        tool1: "회로 시험기 #1",
        tool2: "회로 시험기 #2",
        wb3: "내전압 검사·포장",
        robotDock: "자율 운반 로봇",
        outBox: "출하 팔레트",
      },
      products: {
        productA: {
          partNumber: "EMS-204",
          name: "PLC 원격 제어 모듈 (EMS-204)",
          shortName: "PLC 제어모듈",
          tag: "회로·펌웨어 시험기 오래 사용",
          opNotes: {
            pickHandling: "회로 보드·방열판 수령",
            preAssembly: "방열패드 및 나사 체결",
            toolWork: "펌웨어 입력 및 통신 시험",
            inspectionPack: "외관 확인 및 정전기 포장",
          },
        },
        productB: {
          partNumber: "EMS-880",
          name: "인버터 드라이브 함체 (EMS-880)",
          shortName: "인버터 함체",
          tag: "고전압 내전압 안전검사 오래 걸림",
          opNotes: {
            pickHandling: "부스바·하네스 수령",
            preAssembly: "단자대 배선 및 토크 체결",
            toolWork: "제어 전원 인가 확인",
            inspectionPack: "1500V 내전압 절연 시험·포장",
          },
        },
      },
      scenarios: {
        baseline: {
          costPill: "현재 상태 · 0원",
          title: "현재 작업장",
          question: "기본 상태 (자재대 멀리 있음 · 회로 시험기 1대)",
          shortBottleneck: "부품 이동 + 회로 시험기 1대 앞 줄서기",
        },
        move_bins: {
          costPill: "+240만 원 ($1.8k)",
          title: "자재대 가까이 배치",
          question: "부품 선반을 조립대 바로 옆으로 밀착 배치",
          shortBottleneck: "걸음은 줄었지만 회로 시험기 앞 대기 지속",
        },
        add_tool: {
          costPill: "+1,680만 원 ($12.5k)",
          title: "회로 시험기 1대 추가",
          question: "병목이던 공용 회로 시험기를 2대로 증설",
          shortBottleneck: "시험기 대기 완전 해결! (가장 추천)",
        },
        add_robot: {
          costPill: "+8,700만 원 ($65k)",
          title: "자율 운반 로봇 도입",
          question: "고가 로봇이 부품 토트를 조립대로 자동 배달",
          shortBottleneck: "운반만 빨라질 뿐 회로 시험기에서 막힘",
        },
      },
      constraintDefault:
        "작업자 3명 유지. 고전압 내전압 시험대는 안전 펜스에 고정되어 이동 불가하며 검사 담당자(3번)만 전담.",
    },
  },
  step1: {
    badge: "작업장 맞춤 설정",
    title: "우리 공장의 설비 위치와 작업 시간을 맞춰보세요",
    subtitle: "설비를 마우스로 끌어 옮기거나 작업 시간을 바꾸면 시뮬레이션에 바로 반영됩니다.",
    layoutTitle: "① 작업장 배치도 (마우스로 설비를 끌어 옮겨보세요)",
    layoutDesc: "자재대나 가공·조립대를 원하는 위치로 드래그해 보세요. (마지막 검사대는 고정)",
    resetLayoutBtn: "원래 위치로 초기화",
    canvasDragBadge: "마우스로 설비를 끌어 위치를 바꿔보세요",
    realismTitle: "② 현장 손실 조건 (품종 교체 세팅 & 불량 재작업)",
    realismDesc: "품목이 바뀔 때 걸리는 세팅 시간과 검사 불량 시 다시 가공하는 비율을 선택하세요.",
    changeoverLabel: "🔄 품목 교체 세팅 시간",
    changeoverOptions: {
      s0: "없음 (0초)",
      s8: "보통 (6초)",
      s14: "김 (12초)",
    },
    reworkLabel: "⚠️ 검사 불량 재작업률",
    reworkOptions: {
      r0: "없음 (0%)",
      r15: "보통 (15%)",
      r25: "높음 (25%)",
    },
    orderTimeTitle: "② 품목별 주문 수량 및 단계별 작업 시간 (초)",
    orderTimeDesc: "숫자를 바꾸면 하루 생산량과 병목 구간이 자동으로 다시 계산됩니다.",
    presetStandardBtn: "평소 주문 (A 5개 + B 5개)",
    presetUrgentBtn: "긴급 주문 (검사 오래 걸리는 B 8개)",
    orderCountLabel: "수량",
    unitCount: "개",
    sourceAssumed: "추정",
    sourceMeasured: "실측",
    secondsTakes: "초",
    constraintTitle: "④ 현장 고정 규칙 (한 줄 메모)",
    reparseBtn: "적용하기",
    parsingBtn: "적용 중...",
    systemConfirmPrefix: "적용 완료:",
    defaultSystemConfirm:
      "품목 A 5개와 품목 B 5개 혼합 작업 기준입니다. 품목 교체 세팅과 불량 재작업이 함께 시뮬레이션됩니다.",
    urgentSystemConfirm:
      "긴급 주문 적용 완료: 정밀 검사 시간이 긴 품목 B가 8개로 늘어나 마지막 검사대 앞 줄서기가 심해집니다.",
    goCompareBtn: "4가지 개선 방법 비교 보러가기",
  },
  step2: {
    orderSummary: (partA: string, countA: number, partB: string, countB: number) =>
      `시험 조건: ${partA} ${countA}개 + ${partB} ${countB}개 (총 ${countA + countB}개 생산)`,
    heroTitle: "무엇을 바꿔야 하루 생산량이 가장 많이 늘어날까요?",
    heroSubtitle: "카드를 눌러 4가지 방법의 완료 시간 · 하루 생산량 · 투자 회수 기간을 비교해 보세요.",
    selectedBadge: "선택됨",
    totalTimeLabel: (totalOrders: number) => `${totalOrders}개 완료 시간`,
    unitSeconds: "초",
    fasterBy: (sec: number) => `${sec}초 단축`,
    almostSame: "차이 미미",
    whereBlockedTitle: "막히는 이유:",
    metrics: {
      shiftOutputLabel: "하루(8시간) 생산량",
      shiftOutputUnit: "개",
      uphLabel: "시간당 생산량",
      uphUnit: "개/시간",
      laborCostLabel: "개당 인건비",
      paybackLabel: "투자금 회수 기간",
      paybackImmediate: "즉시 (0원)",
      paybackMonths: (m: number) => `약 ${m}개월`,
      paybackNever: "회수 어려움",
      setupAndReworkLabel: "세팅·재작업",
      setupAndReworkValue: (setupSec: number, reworkCnt: number) =>
        `세팅 ${setupSec}초 · 재작업 ${reworkCnt}건`,
    },
    player: {
      pauseBtn: "일시정지",
      playBtn: "작업 모습 재생",
      restartBtn: "처음부터",
      view2D: "평면도 (2D)",
      view3D: "입체 보기 (3D)",
      singleViewBtn: "크게 보기",
      multiViewBtn: "4개 동시에 보기",
      closeHighlight: "닫기",
      jumpBanner: (sec: number) => `지금(${sec}초)이 줄서기가 가장 심한 순간입니다.`,
      timeScrubberLabel: (sec: number) => `${sec}초`,
      completedStatus: (done: number, total: number) => `완료 ${done} / ${total}개`,
    },
    whySection: {
      title: "왜 이런 결과가 나왔을까요?",
      subtitle: "카드를 누르면 작업자가 줄 서서 기다리는 순간으로 바로 이동합니다.",
      watchMomentBtn: "▶ 장면 보기",
    },
    policyBox: {
      title: "돈 안 들이고 작업 순서만 바꾸면 어떨까요?",
      desc: "공용 설비가 사용 중일 때 가만히 서서 기다리지 않고 다음 부품을 미리 가져오고, 같은 품목을 묶어서 작업하는 AI 방식입니다.",
      fixedTitle: "① 기존 방식 (순서대로 대기)",
      fixedDesc: "앞사람이 설비를 다 쓸 때까지 서서 기다림",
      aiTitle: "② AI 작업 순서 최적화 (추천)",
      aiDesc: "기다리는 동안 다음 부품 미리 준비 + 같은 품목 연속 작업",
    },
  },
  step3: {
    pollBadge: "현장 의사결정 비교",
    pollTitle: "공장장님이라면 어디에 투자하시겠습니까?",
    pollSubtitle: "눈대중으로 좋아 보이는 방법과 시뮬레이션 결과를 비교해 보세요.",
    pickedBadge: "선택됨",
    resultLabel: "완료 시간:",
    savedLabel: (sec: number) => `(${sec}초 단축)`,
    validationTitle: "실제 스톱워치 측정 결과와 비교",
    validationDesc: "시뮬레이션 예측 시간과 실제로 사람이 똑같이 작업하며 스톱워치로 잰 시간을 비교했습니다.",
    matchedBadge: "결과 일치",
    predictedTimeLabel: "시뮬레이터 예측",
    actualTimeLabel: "실제 스톱워치 측정",
    actualObservationPrefix: "현장 관찰:",
  },
  canvas: {
    walkTimeApprox: (sec: number) => `이동 약 ${sec}초`,
    fixedSubLabel: "위치 고정",
    draggableSubLabel: "드래그 가능",
    sharedToolSubLabel: "공용 설비",
    queuedItemsBadge: (count: number) => `대기 ${count}개`,
    progressOverlay: (sec: number, done: number) => `${sec}초 · 완료 ${done}개`,
    rotate3DLabel: "마우스로 회전",
    stationNames: {
      binA: "자재대 A",
      binB: "자재대 B",
      wb1: "작업대 #1",
      wb2: "작업대 #2",
      tool1: "공용 설비 #1",
      tool2: "공용 설비 #2",
      wb3: "최종 검사·포장",
      robotDock: "운반 로봇",
      outBox: "출하대",
    },
    agentTags: {
      worker1: "작업1",
      worker2: "작업2",
      worker3: "검사3",
      robot1: "로봇",
    },
    bubbles: {
      waitingTool: "⏳ 설비 줄서기 중!",
      prePicking: "⚡ 다음 부품 미리 준비!",
      changeover: "🔄 지그·세팅 교체 중",
      rework: "🛠️ 불량 재작업 중!",
      assembling: "가공·조립 중",
      usingTool: "공용 설비 작업 중",
      inspecting: "검사·포장 중",
      movingToBin: "자재 가지러 이동",
      movingToWb: "작업대로 이동",
      delivering: "검사대로 전달",
      robotDelivering: "로봇 자재 배달",
      idle: "대기",
    },
    banners: {
      bothCongested: (toolWaiters: number, inspectWip: number) =>
        `⚠️ 공용 설비 대기(${toolWaiters}명) + 검사대 앞 ${inspectWip}개 적체!`,
      toolCongested: "⚠️ 공용 설비가 1대뿐이라 줄 서서 기다리는 중입니다!",
      inspectCongested: (inspectWip: number) =>
        `⚠️ 마지막 검사대 앞에 물건 ${inspectWip}개가 밀려 있습니다!`,
    },
  },
  insights: {
    baseline: {
      t1Title: "자재대 왕복 이동 + 공용 설비 줄서기 발생",
      t1Sentence: (avgMove: number, toolWait: number, setupSec: number) =>
        `자재를 가지러 왕복하느라 평균 ${avgMove}초를 썼고, 1대뿐인 공용 설비 앞에서 ${toolWait}초 줄 서서 기다렸으며 세팅 교체에 ${setupSec}초가 걸렸습니다.`,
      t2Title: "마지막 검사대 앞에 물건이 쌓이고 재작업 발생",
      t2Sentence: (maxQueue: number, reworkCount: number) =>
        `중반 이후 물건이 한꺼번에 몰리면서 검사대 앞에 최대 ${maxQueue}개가 쌓였고, 불량 재작업이 ${reworkCount}건 발생했습니다.`,
    },
    move_bins: {
      t1Title: "걸음은 줄었지만 ‘공용 설비 앞 줄서기’가 더 심해짐",
      t1Sentence: (moveSavedPct: number, totalSavedPct: number, toolWait: number) =>
        `자재대를 옆에 붙여 이동 시간은 ${moveSavedPct}% 줄었지만 전체 시간은 ${totalSavedPct}%만 줄었습니다. 두 작업자가 동시에 공용 설비 앞에서 ${toolWait}초 동안 부딪혔기 때문입니다.`,
      t2Title: "아낀 이동 시간이 검사대 대기열로 그대로 옮겨감",
      t2Sentence: (maxQueue: number) =>
        `뒷단 설비를 늘리지 않고 앞단 이동만 줄이면 마지막 검사대 앞에 물건이 ${maxQueue}개까지 쌓여 전체 출하량은 크게 늘지 않습니다.`,
    },
    add_tool: {
      t1Title: "공용 설비 1대 추가로 줄서기 0초 달성! (최고 효과)",
      t1Sentence: (baseToolWait: number, totalSavedPct: number, shiftDiff: number) =>
        `병목이던 공용 설비를 2대로 늘리자 줄서기(${baseToolWait}초)가 완전히 사라져 완료 시간이 ${totalSavedPct}% 빨라지고 하루 생산량이 +${shiftDiff}개 늘어납니다.`,
      t2Title: "이제 마지막 ‘검사·포장대’ 속도가 전체 생산량을 결정함",
      t2Sentence: (maxQueue: number) =>
        `앞단 설비 병목이 풀리면서 검사대 앞에 최대 ${maxQueue}개가 모입니다. 현 시점에서 가장 투자 대비 효과가 확실한 선택입니다.`,
    },
    add_robot: {
      t1Title: "비싼 로봇을 사도 공용 설비와 검사대에서 다시 막힘",
      t1Sentence: (totalSavedPct: number, toolWait: number, paybackMonths: number) =>
        `로봇이 자재를 배달해 주었지만 전체 시간은 ${totalSavedPct}%만 줄었습니다. 공용 설비 줄서기(${toolWait}초)가 그대로라 투자금 회수에 ${paybackMonths}개월 이상 걸립니다.`,
      t2Title: "병목 설비 해결 전 로봇 도입은 대표적인 과잉 투자",
      t2Sentence: (inspectWait: number) =>
        `사람이 기다리는 진짜 이유는 운반이 아니라 공용 설비와 검사 대기(${inspectWait}초)이기 때문에 로봇 효과는 제한적입니다.`,
    },
    aiPolicy: {
      title: "AI 작업 순서 효과: 세팅 최소화 + 기다리는 동안 다음 부품 준비",
      sentence: (setupSec: number) =>
        `같은 품목을 묶어 세팅 시간을 ${setupSec}초로 줄이고, 설비가 사용 중일 때 가만히 서 있지 않고 다음 자재를 미리 가져와 돈 안 들이고 시간을 단축했습니다.`,
    },
  },
  validationNotes: {
    baseline: "두 작업자가 공용 설비 앞에서 부딪혀 기다리고, 검사 불량 재작업 시 흐름이 끊김",
    move_bins: "자재대가 가까워져 손은 빨라졌으나 공용 설비 1대 앞에서 줄서기가 더 심해짐",
    add_tool: "공용 설비 줄서기가 즉시 사라지고 하루 생산량이 가장 크게 증가함",
    add_robot: "로봇이 부품을 날라주지만 공용 설비 1대와 검사 속도에 막혀 투자 대비 효과 낮음",
  },
};

export type LocaleMessages = typeof ko;
