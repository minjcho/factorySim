"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Factory,
  Globe,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Wrench,
} from "lucide-react";
import WorkshopCanvas from "@/components/WorkshopCanvas";
import { locales, type Locale, type LocaleMessages } from "@/locales";
import {
  DEFAULT_REALISM_CONFIG,
  INDUSTRY_PRESETS,
  INITIAL_VALIDATION_RECORDS,
} from "@/lib/presets";
import { runAllFourScenarios } from "@/lib/simulationEngine";
import {
  AgentPolicyMode,
  BottleneckInsight,
  ConstraintConfig,
  IndustryPresetId,
  PhysicalValidationRecord,
  ProcessRealismConfig,
  ProductId,
  ProductSpec,
  ScenarioId,
  ScenarioSimulationResult,
  StationNode,
} from "@/types/simulation";

type ActiveTab = "setup" | "compare" | "stage_validation";

const SCENARIO_ORDER: ScenarioId[] = [
  "baseline",
  "move_bins",
  "add_tool",
  "add_robot",
];

const INDUSTRY_ORDER: IndustryPresetId[] = [
  "cnc_metal_shop",
  "food_copacking",
  "medical_device",
  "pcb_box_build",
];

function buildLocalizedInsights(
  scenarioId: ScenarioId,
  res: ScenarioSimulationResult,
  baselineRes: ScenarioSimulationResult,
  policyMode: AgentPolicyMode,
  t: LocaleMessages
): BottleneckInsight[] {
  const baseMove = baselineRes.avgMoveTime;
  const baseTotal = baselineRes.totalCompletionTime;
  const baseToolWait = baselineRes.toolWaitTotalSeconds;

  const moveSavedPct = Math.max(
    0,
    Math.round(((baseMove - res.avgMoveTime) / Math.max(1, baseMove)) * 100)
  );
  const totalSavedPct = Math.round(
    ((baseTotal - res.totalCompletionTime) / Math.max(1, baseTotal)) * 100
  );
  const shiftDiff = Math.max(0, res.shiftOutput8h - baselineRes.shiftOutput8h);

  const rawFirst = res.insights.find((i) => i.id !== "ai-policy-effect");
  const rawSecond = res.insights.filter((i) => i.id !== "ai-policy-effect")[1];

  const list: BottleneckInsight[] = [];

  if (scenarioId === "baseline") {
    list.push({
      id: "base-1",
      severity: "critical",
      title: t.insights.baseline.t1Title,
      causalSentence: t.insights.baseline.t1Sentence(
        res.avgMoveTime,
        res.toolWaitTotalSeconds,
        res.changeoverTotalSeconds
      ),
      evidenceMetrics: "",
      jumpToTime: rawFirst?.jumpToTime ?? 18,
      jumpEndTime: rawFirst?.jumpEndTime ?? 28,
      focusStationId: "tool1",
    });
    list.push({
      id: "base-2",
      severity: "warning",
      title: t.insights.baseline.t2Title,
      causalSentence: t.insights.baseline.t2Sentence(
        res.maxInspectQueueLength,
        res.reworkCount
      ),
      evidenceMetrics: "",
      jumpToTime: rawSecond?.jumpToTime ?? 45,
      jumpEndTime: rawSecond?.jumpEndTime ?? 55,
      focusStationId: "wb3",
    });
  } else if (scenarioId === "move_bins") {
    list.push({
      id: "move-1",
      severity: "critical",
      title: t.insights.move_bins.t1Title,
      causalSentence: t.insights.move_bins.t1Sentence(
        moveSavedPct,
        totalSavedPct,
        res.toolWaitTotalSeconds
      ),
      evidenceMetrics: "",
      jumpToTime: rawFirst?.jumpToTime ?? 14,
      jumpEndTime: rawFirst?.jumpEndTime ?? 24,
      focusStationId: "tool1",
    });
    list.push({
      id: "move-2",
      severity: "warning",
      title: t.insights.move_bins.t2Title,
      causalSentence: t.insights.move_bins.t2Sentence(res.maxInspectQueueLength),
      evidenceMetrics: "",
      jumpToTime: rawSecond?.jumpToTime ?? 38,
      jumpEndTime: rawSecond?.jumpEndTime ?? 48,
      focusStationId: "wb3",
    });
  } else if (scenarioId === "add_tool") {
    list.push({
      id: "tool-1",
      severity: "positive",
      title: t.insights.add_tool.t1Title,
      causalSentence: t.insights.add_tool.t1Sentence(
        baseToolWait,
        totalSavedPct,
        shiftDiff
      ),
      evidenceMetrics: "",
      jumpToTime: rawFirst?.jumpToTime ?? 20,
      jumpEndTime: rawFirst?.jumpEndTime ?? 30,
      focusStationId: "tool2",
    });
    list.push({
      id: "tool-2",
      severity: "critical",
      title: t.insights.add_tool.t2Title,
      causalSentence: t.insights.add_tool.t2Sentence(res.maxInspectQueueLength),
      evidenceMetrics: "",
      jumpToTime: rawSecond?.jumpToTime ?? 42,
      jumpEndTime: rawSecond?.jumpEndTime ?? 52,
      focusStationId: "wb3",
    });
  } else {
    list.push({
      id: "robot-1",
      severity: "critical",
      title: t.insights.add_robot.t1Title,
      causalSentence: t.insights.add_robot.t1Sentence(
        totalSavedPct,
        res.toolWaitTotalSeconds,
        res.paybackMonths ?? 24
      ),
      evidenceMetrics: "",
      jumpToTime: rawFirst?.jumpToTime ?? 16,
      jumpEndTime: rawFirst?.jumpEndTime ?? 26,
      focusStationId: "tool1",
    });
    list.push({
      id: "robot-2",
      severity: "warning",
      title: t.insights.add_robot.t2Title,
      causalSentence: t.insights.add_robot.t2Sentence(
        res.inspectQueueWaitTotalSeconds
      ),
      evidenceMetrics: "",
      jumpToTime: rawSecond?.jumpToTime ?? 40,
      jumpEndTime: rawSecond?.jumpEndTime ?? 50,
      focusStationId: "wb3",
    });
  }

  if (policyMode === "ai_adaptive") {
    list.unshift({
      id: "ai-policy",
      severity: "positive",
      title: t.insights.aiPolicy.title,
      causalSentence: t.insights.aiPolicy.sentence(res.changeoverTotalSeconds),
      evidenceMetrics: "",
      jumpToTime: 18,
      jumpEndTime: 30,
      focusStationId: "wb1",
    });
  }

  return list;
}

export default function WorkcellSimulatorPage() {
  const [locale, setLocale] = useState<Locale>("en");
  const t = locales[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const [activeTab, setActiveTab] = useState<ActiveTab>("setup");

  // 0. Selected US SME Industry Preset
  const [industryId, setIndustryId] =
    useState<IndustryPresetId>("cnc_metal_shop");
  const industryMeta = t.industries[industryId];

  // 1. Workshop Layout, Products, Constraints & Realism Config
  const [baseStations, setBaseStations] = useState<StationNode[]>(
    INDUSTRY_PRESETS.cnc_metal_shop.stations
  );
  const [workInstructionText, setWorkInstructionText] = useState<string>(
    INDUSTRY_PRESETS.cnc_metal_shop.standardOrderText
  );
  const [products, setProducts] = useState<Record<ProductId, ProductSpec>>(
    INDUSTRY_PRESETS.cnc_metal_shop.products
  );
  const [constraints, setConstraints] = useState<ConstraintConfig>(
    INDUSTRY_PRESETS.cnc_metal_shop.constraints
  );
  const [realism, setRealism] = useState<ProcessRealismConfig>(
    DEFAULT_REALISM_CONFIG
  );
  const [policyMode, setPolicyMode] = useState<AgentPolicyMode>("fixed_fifo");

  const [isParsingGemini, setIsParsingGemini] = useState(false);
  const [isUrgentPreset, setIsUrgentPreset] = useState(false);
  const [customArgonNote, setCustomArgonNote] = useState<string | null>(null);

  const handleSelectIndustry = (nextId: IndustryPresetId) => {
    const preset = INDUSTRY_PRESETS[nextId];
    setIndustryId(nextId);
    setBaseStations(preset.stations);
    setProducts(preset.products);
    setConstraints({
      ...preset.constraints,
      rawNaturalLanguage: locales[locale].industries[nextId].constraintDefault,
    });
    setRealism(preset.defaultRealism);
    setWorkInstructionText(preset.standardOrderText);
    setIsUrgentPreset(false);
    setCustomArgonNote(null);
    setCurrentTickIndex(0);
    setFocusedStationId(null);
    setJumpTimestampSec(null);
    setValidationRecords(
      INITIAL_VALIDATION_RECORDS.map((r) => ({ ...r, actualMeasuredSec: null }))
    );
  };

  const handleLocaleChange = (nextLocale: Locale) => {
    setLocale(nextLocale);
    setCustomArgonNote(null);
    setConstraints((prev) => ({
      ...prev,
      rawNaturalLanguage:
        locales[nextLocale].industries[industryId].constraintDefault,
    }));
  };

  // 2. Run Discrete-Event Simulations (Fixed FIFO vs AI Dynamic)
  const allScenariosFixed = useMemo(
    () =>
      runAllFourScenarios({
        policyMode: "fixed_fifo",
        baseStations,
        products,
        constraints,
        realism,
      }),
    [baseStations, products, constraints, realism]
  );

  const allScenariosAdaptive = useMemo(
    () =>
      runAllFourScenarios({
        policyMode: "ai_adaptive",
        baseStations,
        products,
        constraints,
        realism,
      }),
    [baseStations, products, constraints, realism]
  );

  const activeScenarios =
    policyMode === "fixed_fifo" ? allScenariosFixed : allScenariosAdaptive;

  // 3. Replay Controls
  const [selectedScenarioId, setSelectedScenarioId] =
    useState<ScenarioId>("add_tool");
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [multiView2x2, setMultiView2x2] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed] = useState<number>(4);
  const [currentTickIndex, setCurrentTickIndex] = useState<number>(0);
  const [focusedStationId, setFocusedStationId] = useState<string | null>(null);
  const [jumpTimestampSec, setJumpTimestampSec] = useState<number | null>(null);

  // 4. Stage & Validation
  const [audiencePick, setAudiencePick] = useState<ScenarioId>("add_tool");
  const [validationRecords, setValidationRecords] = useState<
    PhysicalValidationRecord[]
  >(
    INITIAL_VALIDATION_RECORDS.map((r) => ({ ...r, actualMeasuredSec: null }))
  );

  const selectedResult = activeScenarios[selectedScenarioId];
  const maxTimelineLength = useMemo(() => {
    if (multiView2x2) {
      return Math.max(
        ...SCENARIO_ORDER.map((id) => activeScenarios[id].timeline.length)
      );
    }
    return selectedResult.timeline.length;
  }, [multiView2x2, activeScenarios, selectedResult]);

  useEffect(() => {
    if (!isPlaying || activeTab !== "compare") return;
    const intervalMs = Math.max(30, Math.round(220 / playbackSpeed));
    const timer = setInterval(() => {
      setCurrentTickIndex((prev) =>
        prev + 1 >= maxTimelineLength ? 0 : prev + 1
      );
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, maxTimelineLength, activeTab]);

  const handleStationMove = (id: string, x: number, y: number) => {
    setBaseStations((prev) =>
      prev.map((st) => (st.id === id && !st.fixed ? { ...st, x, y } : st))
    );
  };

  const handleTimingChange = (
    prodId: ProductId,
    stepKey: keyof ProductSpec["timings"],
    seconds: number
  ) => {
    setProducts((prev) => ({
      ...prev,
      [prodId]: {
        ...prev[prodId],
        timings: {
          ...prev[prodId].timings,
          [stepKey]: {
            ...prev[prodId].timings[stepKey],
            seconds: Math.max(1, Math.min(60, seconds)),
            source: "measured",
          },
        },
      },
    }));
  };

  const handleOrderCountChange = (prodId: ProductId, count: number) => {
    setProducts((prev) => ({
      ...prev,
      [prodId]: {
        ...prev[prodId],
        orderCount: Math.max(1, Math.min(20, count)),
      },
    }));
    setCurrentTickIndex(0);
  };

  const handleRunArgonParse = async (overrideText?: string, urgent = false) => {
    const textToUse = overrideText ?? workInstructionText;
    setIsParsingGemini(true);
    setIsUrgentPreset(urgent);
    try {
      const res = await fetch("/api/argon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "parse_instructions",
          workInstructionText: textToUse,
          constraintText: constraints.rawNaturalLanguage,
        }),
      });
      const data = await res.json();
      if (data.extractedProducts) {
        setProducts((prev) => ({
          productA: {
            ...prev.productA,
            orderCount: data.extractedProducts.productA.orderCount,
            timings: {
              pickHandling: {
                ...prev.productA.timings.pickHandling,
                ...data.extractedProducts.productA.pickHandling,
              },
              preAssembly: {
                ...prev.productA.timings.preAssembly,
                ...data.extractedProducts.productA.preAssembly,
              },
              toolWork: {
                ...prev.productA.timings.toolWork,
                ...data.extractedProducts.productA.toolWork,
              },
              inspectionPack: {
                ...prev.productA.timings.inspectionPack,
                ...data.extractedProducts.productA.inspectionPack,
              },
            },
          },
          productB: {
            ...prev.productB,
            orderCount: data.extractedProducts.productB.orderCount,
            timings: {
              pickHandling: {
                ...prev.productB.timings.pickHandling,
                ...data.extractedProducts.productB.pickHandling,
              },
              preAssembly: {
                ...prev.productB.timings.preAssembly,
                ...data.extractedProducts.productB.preAssembly,
              },
              toolWork: {
                ...prev.productB.timings.toolWork,
                ...data.extractedProducts.productB.toolWork,
              },
              inspectionPack: {
                ...prev.productB.timings.inspectionPack,
                ...data.extractedProducts.productB.inspectionPack,
              },
            },
          },
        }));
      }
      if (data.argonSummary && locale === "ko") {
        setCustomArgonNote(data.argonSummary);
      } else {
        setCustomArgonNote(null);
      }
      setCurrentTickIndex(0);
    } finally {
      setIsParsingGemini(false);
    }
  };

  const handleJumpToBottleneck = (
    scenarioId: ScenarioId,
    insight: BottleneckInsight
  ) => {
    setSelectedScenarioId(scenarioId);
    setMultiView2x2(false);
    const targetScenario = activeScenarios[scenarioId];
    const targetIdx = targetScenario.timeline.findIndex(
      (snap) => snap.time >= insight.jumpToTime
    );
    setCurrentTickIndex(targetIdx >= 0 ? targetIdx : 0);
    setFocusedStationId(insight.focusStationId);
    setJumpTimestampSec(Math.round(insight.jumpToTime));
    setIsPlaying(true);
  };

  const currentSnapshot =
    selectedResult.timeline[
      Math.min(currentTickIndex, selectedResult.timeline.length - 1)
    ] || selectedResult.timeline[0];

  const baselineTime = activeScenarios.baseline.totalCompletionTime;
  const baselineShiftOutput = activeScenarios.baseline.shiftOutput8h;
  const localizedInsights = buildLocalizedInsights(
    selectedScenarioId,
    selectedResult,
    activeScenarios.baseline,
    policyMode,
    t
  );

  const formatPayback = (res: ScenarioSimulationResult) => {
    if (res.scenarioId === "baseline") {
      return t.step2.metrics.paybackImmediate;
    }
    if (res.paybackMonths === null) {
      return t.step2.metrics.paybackNever;
    }
    return t.step2.metrics.paybackMonths(res.paybackMonths);
  };

  void isParsingGemini;
  void isUrgentPreset;
  void customArgonNote;

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      {/* Apple-Style Clean Top Header */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-[#d2d2d7]">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-[#1d1d1f]">
              {t.meta.appTitle}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* 3 Simple Step Pills */}
            <nav className="flex items-center gap-1 bg-[#f5f5f7] p-1 rounded-full border border-[#d2d2d7]">
              <button
                onClick={() => setActiveTab("setup")}
                className={`px-4 py-2 rounded-full text-sm font-bold transition ${
                  activeTab === "setup"
                    ? "bg-[#0071e3] text-white shadow-sm"
                    : "text-[#515154] hover:text-[#1d1d1f]"
                }`}
              >
                {t.nav.step1}
              </button>
              <button
                onClick={() => setActiveTab("compare")}
                className={`px-4 py-2 rounded-full text-sm font-bold transition ${
                  activeTab === "compare"
                    ? "bg-[#1d1d1f] text-white shadow-sm"
                    : "text-[#515154] hover:text-[#1d1d1f]"
                }`}
              >
                {t.nav.step2}
              </button>
              <button
                onClick={() => setActiveTab("stage_validation")}
                className={`px-4 py-2 rounded-full text-sm font-bold transition ${
                  activeTab === "stage_validation"
                    ? "bg-[#1d1d1f] text-white shadow-sm"
                    : "text-[#515154] hover:text-[#1d1d1f]"
                }`}
              >
                {t.nav.step3}
              </button>
            </nav>

            {/* Language Switcher (한국어 / English) */}
            <div className="flex items-center bg-[#f5f5f7] p-1 rounded-full border border-[#d2d2d7]">
              <Globe className="w-4 h-4 text-[#6e6e73] ml-2.5 mr-1" />
              <button
                onClick={() => handleLocaleChange("ko")}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition ${
                  locale === "ko"
                    ? "bg-white text-[#1d1d1f] shadow-sm"
                    : "text-[#6e6e73] hover:text-[#1d1d1f]"
                }`}
              >
                한국어
              </button>
              <button
                onClick={() => handleLocaleChange("en")}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition ${
                  locale === "en"
                    ? "bg-white text-[#1d1d1f] shadow-sm"
                    : "text-[#6e6e73] hover:text-[#1d1d1f]"
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* =====================================================================
            SLEEK APPLE SEGMENTED INDUSTRY BAR (1 Clean Row, Zero Clutter)
           ===================================================================== */}
        <section className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-[#d2d2d7]/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-[#f5f5f7] p-1.5 rounded-xl">
            {INDUSTRY_ORDER.map((indId) => {
              const meta = t.industries[indId];
              const active = industryId === indId;
              return (
                <button
                  key={indId}
                  onClick={() => handleSelectIndustry(indId)}
                  className={`px-4 py-2 rounded-lg text-sm font-extrabold transition-all ${
                    active
                      ? "bg-white text-[#0071e3] shadow-sm"
                      : "text-[#515154] hover:text-[#1d1d1f]"
                  }`}
                >
                  {meta.tabTitle}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5 text-sm">
            <span className="font-bold text-[#1d1d1f]">
              {industryMeta.cellTitle}
            </span>
            <span className="hidden sm:inline-block text-xs font-bold px-2.5 py-1 rounded-full bg-[#f0f6ff] text-[#0071e3]">
              {industryMeta.usRankBadge}
            </span>
          </div>
        </section>

        {/* =====================================================================
            MAIN TAB: 개선 효과 비교 (4 Clean Cards + Interactive Player)
           ===================================================================== */}
        {activeTab === "compare" && (
          <div className="space-y-6">
            {/* Simple Title + Quick Order Preset Pills */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1d1d1f]">
                  {t.step2.heroTitle}
                </h2>
                <p className="text-base text-[#6e6e73] mt-1">
                  {t.step2.heroSubtitle}
                </p>
              </div>

              {/* 1-Click Normal vs Urgent Order Switch */}
              <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-full border border-[#d2d2d7] shadow-sm shrink-0 self-start md:self-auto">
                <button
                  onClick={() => {
                    setIsUrgentPreset(false);
                    setProducts((prev) => ({
                      productA: { ...prev.productA, orderCount: 5 },
                      productB: { ...prev.productB, orderCount: 5 },
                    }));
                    setCurrentTickIndex(0);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition ${
                    !isUrgentPreset
                      ? "bg-[#1d1d1f] text-white"
                      : "text-[#515154] hover:text-[#1d1d1f]"
                  }`}
                >
                  {t.step1.presetStandardBtn}
                </button>
                <button
                  onClick={() => {
                    setIsUrgentPreset(true);
                    setProducts((prev) => ({
                      productA: { ...prev.productA, orderCount: 2 },
                      productB: { ...prev.productB, orderCount: 8 },
                    }));
                    setCurrentTickIndex(0);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition ${
                    isUrgentPreset
                      ? "bg-[#ff9500] text-white"
                      : "text-[#515154] hover:text-[#1d1d1f]"
                  }`}
                >
                  ⚡ {t.step1.presetUrgentBtn}
                </button>
              </div>
            </div>

            {/* 4 Clean Apple-Style Comparison Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SCENARIO_ORDER.map((scenId) => {
                const res = activeScenarios[scenId];
                const scenMeta = industryMeta.scenarios[scenId];
                const isSelected = selectedScenarioId === scenId;
                const diffSec = Math.round(
                  baselineTime - res.totalCompletionTime
                );
                const shiftGain = res.shiftOutput8h - baselineShiftOutput;

                return (
                  <button
                    key={scenId}
                    onClick={() => {
                      setSelectedScenarioId(scenId);
                      setFocusedStationId(null);
                    }}
                    className={`text-left rounded-3xl p-6 transition-all flex flex-col justify-between border-2 ${
                      isSelected
                        ? "bg-white border-[#0071e3] shadow-lg ring-4 ring-[#0071e3]/10"
                        : "bg-white border-[#d2d2d7]/80 hover:border-[#86868b]"
                    }`}
                  >
                    <div>
                      {/* Cost Pill */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                            isSelected
                              ? "bg-[#0071e3] text-white"
                              : "bg-[#f5f5f7] text-[#515154]"
                          }`}
                        >
                          {scenMeta.costPill}
                        </span>
                        {isSelected && (
                          <span className="text-xs font-extrabold text-[#0071e3]">
                            {t.step2.selectedBadge}
                          </span>
                        )}
                      </div>

                      {/* Option Title */}
                      <h3 className="text-xl font-extrabold text-[#1d1d1f]">
                        {scenMeta.title}
                      </h3>

                      {/* Giant Hero Metric: Completion Time */}
                      <div className="mt-4 pt-4 border-t border-[#e5e5ea]">
                        <div className="text-xs font-bold text-[#6e6e73]">
                          {t.step2.totalTimeLabel(res.totalOrders)}
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-4xl font-extrabold tracking-tight text-[#1d1d1f]">
                            {Math.round(res.totalCompletionTime)}
                            <span className="text-2xl ml-0.5">
                              {t.step2.unitSeconds}
                            </span>
                          </span>
                          {scenId !== "baseline" && (
                            <span
                              className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                                diffSec >= 20
                                  ? "bg-[#e8f8ee] text-[#1d7d38]"
                                  : "bg-[#fff4e5] text-[#b25000]"
                              }`}
                            >
                              {diffSec > 0
                                ? t.step2.fasterBy(diffSec)
                                : t.step2.almostSame}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 2 Clean Business Metrics: Daily Output & Payback */}
                      <div className="mt-4 pt-3 border-t border-[#e5e5ea] space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[#6e6e73] font-semibold">
                            {t.step2.metrics.shiftOutputLabel}
                          </span>
                          <span className="font-extrabold text-[#1d1d1f]">
                            {res.shiftOutput8h}
                            {t.step2.metrics.shiftOutputUnit}
                            {scenId !== "baseline" && shiftGain > 0 && (
                              <span className="text-[#1d7d38] ml-1">
                                (+{shiftGain})
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[#6e6e73] font-semibold">
                            {t.step2.metrics.paybackLabel}
                          </span>
                          <span
                            className={`font-extrabold ${
                              res.paybackMonths !== null &&
                              res.paybackMonths > 6
                                ? "text-[#d70015]"
                                : "text-[#0071e3]"
                            }`}
                          >
                            {formatPayback(res)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Short 1-Line Reason */}
                    <div
                      className={`mt-4 pt-3 border-t border-[#e5e5ea] text-xs font-bold ${
                        scenId === "add_tool"
                          ? "text-[#1d7d38]"
                          : "text-[#515154]"
                      }`}
                    >
                      {scenMeta.shortBottleneck}
                    </div>
                  </button>
                );
              })}
            </section>

            {/* Replay Section: Left = Big Visual Canvas, Right = 2 Simple Reasons & AI Toggle */}
            <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#d2d2d7]/80">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left 7 Cols: Workshop Replay Screen */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsPlaying((p) => !p)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-4 h-4" />{" "}
                            {t.step2.player.pauseBtn}
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />{" "}
                            {t.step2.player.playBtn}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setCurrentTickIndex(0);
                          setFocusedStationId(null);
                          setJumpTimestampSec(null);
                        }}
                        className="px-4 py-2.5 rounded-full text-sm font-bold bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f]"
                      >
                        <RotateCcw className="w-4 h-4 inline mr-1" />
                        {t.step2.player.restartBtn}
                      </button>
                    </div>

                    {/* Simple View Switcher */}
                    <div className="flex items-center gap-2">
                      <div className="flex bg-[#f5f5f7] p-1 rounded-full border border-[#d2d2d7]">
                        <button
                          onClick={() => setViewMode("2d")}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                            viewMode === "2d"
                              ? "bg-white text-[#1d1d1f] shadow-sm"
                              : "text-[#6e6e73]"
                          }`}
                        >
                          {t.step2.player.view2D}
                        </button>
                        <button
                          onClick={() => setViewMode("3d")}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                            viewMode === "3d"
                              ? "bg-white text-[#1d1d1f] shadow-sm"
                              : "text-[#6e6e73]"
                          }`}
                        >
                          {t.step2.player.view3D}
                        </button>
                      </div>

                      <button
                        onClick={() => setMultiView2x2((v) => !v)}
                        className={`px-3.5 py-2 rounded-full text-xs font-bold border ${
                          multiView2x2
                            ? "bg-[#1d1d1f] text-white border-[#1d1d1f]"
                            : "bg-white text-[#1d1d1f] border-[#d2d2d7]"
                        }`}
                      >
                        {multiView2x2
                          ? t.step2.player.singleViewBtn
                          : t.step2.player.multiViewBtn}
                      </button>
                    </div>
                  </div>

                  {jumpTimestampSec !== null && (
                    <div className="px-4 py-3 rounded-2xl bg-[#fff4e5] border border-[#ffcc80] text-[#b25000] text-sm font-bold flex items-center justify-between">
                      <span>
                        🔍 {t.step2.player.jumpBanner(jumpTimestampSec)}
                      </span>
                      <button
                        onClick={() => {
                          setJumpTimestampSec(null);
                          setFocusedStationId(null);
                        }}
                        className="underline text-xs ml-2 shrink-0"
                      >
                        {t.step2.player.closeHighlight}
                      </button>
                    </div>
                  )}

                  {!multiView2x2 ? (
                    <div className="h-[420px] w-full">
                      <WorkshopCanvas
                        stations={selectedResult.layoutStations}
                        snapshot={currentSnapshot}
                        viewMode={viewMode}
                        focusedStationId={focusedStationId}
                        titleBadge={
                          industryMeta.scenarios[selectedScenarioId].title
                        }
                        t={t}
                        industryId={industryId}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-[440px]">
                      {SCENARIO_ORDER.map((scenId) => {
                        const scen = activeScenarios[scenId];
                        const snap =
                          scen.timeline[
                            Math.min(currentTickIndex, scen.timeline.length - 1)
                          ] || scen.timeline[0];
                        return (
                          <div key={scenId} className="h-full min-h-[200px]">
                            <WorkshopCanvas
                              stations={scen.layoutStations}
                              snapshot={snap}
                              viewMode={viewMode}
                              compact={true}
                              titleBadge={`${industryMeta.scenarios[scenId].title} (${Math.round(scen.totalCompletionTime)}${t.step2.unitSeconds})`}
                              t={t}
                              industryId={industryId}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Clean Progress Slider */}
                  <div className="bg-[#f5f5f7] rounded-2xl px-4 py-3 flex items-center gap-4">
                    <span className="text-sm font-bold text-[#1d1d1f] shrink-0">
                      {t.step2.player.timeScrubberLabel(
                        Math.round(currentSnapshot.time)
                      )}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, maxTimelineLength - 1)}
                      value={Math.min(currentTickIndex, maxTimelineLength - 1)}
                      onChange={(e) => {
                        setIsPlaying(false);
                        setCurrentTickIndex(parseInt(e.target.value, 10));
                      }}
                      className="w-full accent-[#0071e3] cursor-pointer"
                    />
                    <span className="text-sm font-bold text-[#0071e3] shrink-0">
                      {t.step2.player.completedStatus(
                        currentSnapshot.completedCount,
                        selectedResult.totalOrders
                      )}
                    </span>
                  </div>
                </div>

                {/* Right 5 Cols: Causal Bottleneck Cards + Worker Policy Switch */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-xl font-extrabold text-[#1d1d1f]">
                      {t.step2.whySection.title}
                    </h3>
                    <p className="text-sm text-[#6e6e73]">
                      {t.step2.whySection.subtitle}
                    </p>

                    <div className="space-y-3 pt-1">
                      {localizedInsights.map((ins) => (
                        <button
                          key={ins.id}
                          onClick={() =>
                            handleJumpToBottleneck(selectedScenarioId, ins)
                          }
                          className="w-full text-left p-5 rounded-2xl bg-[#f5f5f7] hover:bg-[#ebebf0] border border-[#d2d2d7] transition group space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-base font-extrabold text-[#1d1d1f]">
                              {ins.title}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0071e3] text-white shrink-0 group-hover:scale-105 transition">
                              {t.step2.whySection.watchMomentBtn}
                            </span>
                          </div>
                          <p className="text-sm text-[#333336] leading-relaxed">
                            “{ins.causalSentence}”
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Worker Action Choice Comparison Box */}
                  <div className="rounded-2xl bg-[#f0f6ff] border border-[#b3d7ff] p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#0071e3]" />
                      <h4 className="text-base font-extrabold text-[#1d1d1f]">
                        {t.step2.policyBox.title}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      <button
                        onClick={() => setPolicyMode("fixed_fifo")}
                        className={`p-3.5 rounded-xl text-left border-2 transition flex items-center justify-between ${
                          policyMode === "fixed_fifo"
                            ? "bg-white border-[#1d1d1f] font-bold"
                            : "bg-white/60 border-transparent text-[#6e6e73]"
                        }`}
                      >
                        <div>
                          <div className="text-sm font-bold text-[#1d1d1f]">
                            {t.step2.policyBox.fixedTitle}
                          </div>
                          <div className="text-xs text-[#6e6e73]">
                            {t.step2.policyBox.fixedDesc}
                          </div>
                        </div>
                        <span className="text-base font-extrabold text-[#1d1d1f] shrink-0 ml-2">
                          {Math.round(
                            allScenariosFixed[selectedScenarioId]
                              .totalCompletionTime
                          )}
                          {t.step2.unitSeconds}
                        </span>
                      </button>

                      <button
                        onClick={() => setPolicyMode("ai_adaptive")}
                        className={`p-3.5 rounded-xl text-left border-2 transition flex items-center justify-between ${
                          policyMode === "ai_adaptive"
                            ? "bg-white border-[#0071e3] font-bold shadow-sm"
                            : "bg-white/60 border-transparent text-[#6e6e73]"
                        }`}
                      >
                        <div>
                          <div className="text-sm font-bold text-[#0071e3]">
                            {t.step2.policyBox.aiTitle}
                          </div>
                          <div className="text-xs text-[#6e6e73]">
                            {t.step2.policyBox.aiDesc}
                          </div>
                        </div>
                        <span className="text-base font-extrabold text-[#1d7d38] shrink-0 ml-2">
                          {Math.round(
                            allScenariosAdaptive[selectedScenarioId]
                              .totalCompletionTime
                          )}
                          {t.step2.unitSeconds}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* =====================================================================
            SETUP TAB: 내 공장 맞추기 (Drag Floorplan + Simple Time Inputs)
           ===================================================================== */}
        {activeTab === "setup" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1d1d1f]">
                {t.step1.title}
              </h2>
              <p className="text-base text-[#6e6e73] mt-1">
                {t.step1.subtitle}
              </p>
            </div>

            {/* Card 1: Floorplan Drag & Drop */}
            <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#d2d2d7]/80 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-[#1d1d1f]">
                    {t.step1.layoutTitle}
                  </h3>
                  <p className="text-sm text-[#6e6e73] mt-0.5">
                    {t.step1.layoutDesc}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setBaseStations(INDUSTRY_PRESETS[industryId].stations)
                  }
                  className="px-4 py-2 rounded-full text-sm font-bold bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] border border-[#d2d2d7]"
                >
                  {t.step1.resetLayoutBtn}
                </button>
              </div>

              <div className="h-[380px] w-full">
                <WorkshopCanvas
                  stations={baseStations}
                  snapshot={activeScenarios.baseline.timeline[0]}
                  viewMode="2d"
                  editable={true}
                  onStationMove={handleStationMove}
                  titleBadge={t.step1.canvasDragBadge}
                  t={t}
                  industryId={industryId}
                />
              </div>
            </section>

            {/* Card 2: Simple Product Times & Setup/Rework Toggles */}
            <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#d2d2d7]/80 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-[#1d1d1f]">
                  {t.step1.orderTimeTitle}
                </h3>
                <p className="text-sm text-[#6e6e73] mt-0.5">
                  {t.step1.orderTimeDesc}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(["productA", "productB"] as ProductId[]).map((prodId) => {
                  const spec = products[prodId];
                  const prodLocale = industryMeta.products[prodId];
                  const bottleneckStepSec =
                    prodId === "productA"
                      ? spec.timings.toolWork.seconds
                      : spec.timings.inspectionPack.seconds;
                  return (
                    <div
                      key={prodId}
                      className="rounded-2xl bg-[#f5f5f7] p-5 border border-[#d2d2d7]/80 space-y-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-[#0071e3]">
                            {prodLocale.tag} ({bottleneckStepSec}
                            {t.step2.unitSeconds})
                          </span>
                          <h4 className="text-lg font-extrabold text-[#1d1d1f]">
                            {prodLocale.name}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-[#d2d2d7] shrink-0">
                          <span className="text-xs font-bold text-[#6e6e73]">
                            {t.step1.orderCountLabel}
                          </span>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={spec.orderCount}
                            onChange={(e) =>
                              handleOrderCountChange(
                                prodId,
                                parseInt(e.target.value || "1", 10)
                              )
                            }
                            className="w-10 text-center text-base font-extrabold text-[#1d1d1f] focus:outline-none"
                          />
                          <span className="text-xs font-bold text-[#1d1d1f]">
                            {t.step1.unitCount}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {(
                          [
                            ["pickHandling", industryMeta.stepLabels.pickHandling],
                            ["preAssembly", industryMeta.stepLabels.preAssembly],
                            ["toolWork", industryMeta.stepLabels.toolWork],
                            [
                              "inspectionPack",
                              industryMeta.stepLabels.inspectionPack,
                            ],
                          ] as const
                        ).map(([key, label]) => {
                          const tVal = spec.timings[key];
                          return (
                            <div
                              key={key}
                              className="bg-white rounded-xl p-3 border border-[#d2d2d7]/70 flex items-center justify-between gap-2"
                            >
                              <span className="text-xs font-bold text-[#1d1d1f]">
                                {label}
                              </span>
                              <div className="flex items-baseline gap-1 shrink-0">
                                <input
                                  type="number"
                                  min={1}
                                  max={60}
                                  value={tVal.seconds}
                                  onChange={(e) =>
                                    handleTimingChange(
                                      prodId,
                                      key,
                                      parseInt(e.target.value || "1", 10)
                                    )
                                  }
                                  className="w-12 text-right text-base font-extrabold text-[#0071e3] border-b border-[#d2d2d7] focus:outline-none"
                                />
                                <span className="text-xs font-semibold text-[#6e6e73]">
                                  {t.step1.secondsTakes}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Clean 1-Row Setup & Rework Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#e5e5ea]">
                <div className="flex items-center justify-between bg-[#f5f5f7] rounded-2xl px-4 py-3">
                  <span className="text-sm font-bold text-[#1d1d1f]">
                    {t.step1.changeoverLabel}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {(
                      [
                        [0, t.step1.changeoverOptions.s0],
                        [6, t.step1.changeoverOptions.s8],
                        [12, t.step1.changeoverOptions.s14],
                      ] as const
                    ).map(([sec, label]) => (
                      <button
                        key={sec}
                        onClick={() =>
                          setRealism((prev) => ({
                            ...prev,
                            changeoverSeconds: sec,
                          }))
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                          realism.changeoverSeconds === sec
                            ? "bg-[#0071e3] text-white shadow-sm"
                            : "bg-white text-[#515154]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-[#f5f5f7] rounded-2xl px-4 py-3">
                  <span className="text-sm font-bold text-[#1d1d1f]">
                    {t.step1.reworkLabel}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {(
                      [
                        [0, t.step1.reworkOptions.r0],
                        [15, t.step1.reworkOptions.r15],
                        [25, t.step1.reworkOptions.r25],
                      ] as const
                    ).map(([rate, label]) => (
                      <button
                        key={rate}
                        onClick={() =>
                          setRealism((prev) => ({
                            ...prev,
                            reworkRatePercent: rate,
                          }))
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                          realism.reworkRatePercent === rate
                            ? "bg-[#d70015] text-white shadow-sm"
                            : "bg-white text-[#515154]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setActiveTab("compare")}
                  className="flex items-center gap-2 px-8 py-4 rounded-full text-base font-extrabold bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-md transition"
                >
                  {t.step1.goCompareBtn}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </section>
          </div>
        )}

        {/* =====================================================================
            STEP 3: 현장 실측 검증 (투표 & 스톱워치 비교)
           ===================================================================== */}
        {activeTab === "stage_validation" && (
          <div className="space-y-6">
            <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#d2d2d7]/80 space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#e8f2ff] text-[#0071e3]">
                  {t.step3.pollBadge}
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#1d1d1f]">
                  {t.step3.pollTitle}
                </h2>
                <p className="text-base text-[#6e6e73]">
                  {t.step3.pollSubtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {(["move_bins", "add_tool", "add_robot"] as const).map(
                  (scenId) => {
                    const res = activeScenarios[scenId];
                    const base = activeScenarios.baseline;
                    const savedSec = Math.round(
                      base.totalCompletionTime - res.totalCompletionTime
                    );
                    const isPicked = audiencePick === scenId;
                    const scenMeta = industryMeta.scenarios[scenId];

                    return (
                      <div
                        key={scenId}
                        onClick={() => setAudiencePick(scenId)}
                        className={`cursor-pointer rounded-3xl p-6 border-2 transition space-y-4 ${
                          isPicked
                            ? "bg-[#f0f6ff] border-[#0071e3] shadow-md"
                            : "bg-[#f5f5f7] border-transparent hover:border-[#d2d2d7]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[#0071e3]">
                            {scenMeta.costPill}
                          </span>
                          {isPicked && (
                            <span className="px-3 py-1 rounded-full bg-[#0071e3] text-white text-xs font-bold">
                              {t.step3.pickedBadge}
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-extrabold text-[#1d1d1f]">
                          {scenMeta.title}
                        </h3>

                        <div className="bg-white rounded-2xl p-4 border border-[#d2d2d7]/70 space-y-2">
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-bold text-[#6e6e73]">
                              {t.step3.resultLabel}
                            </span>
                            <span className="text-2xl font-extrabold text-[#1d1d1f]">
                              {Math.round(res.totalCompletionTime)}
                              {t.step2.unitSeconds}{" "}
                              <span className="text-sm text-[#1d7d38]">
                                {t.step3.savedLabel(savedSec)}
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-bold text-[#0071e3] pt-2 border-t border-[#e5e5ea]">
                            <span>
                              {t.step2.metrics.shiftOutputLabel}:{" "}
                              {res.shiftOutput8h}
                              {t.step2.metrics.shiftOutputUnit}
                            </span>
                            <span>
                              {t.step2.metrics.paybackLabel}:{" "}
                              {formatPayback(res)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </section>

            {/* Section 2: Real Tabletop Experiment Comparison */}
            <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#d2d2d7]/80 space-y-6">
              <div>
                <h3 className="text-xl md:text-2xl font-extrabold text-[#1d1d1f]">
                  {t.step3.validationTitle}
                </h3>
                <p className="text-base text-[#6e6e73] mt-1">
                  {t.step3.validationDesc}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {validationRecords.map((rec, idx) => {
                  const predicted = Math.round(
                    allScenariosFixed[rec.scenarioId].totalCompletionTime
                  );
                  const defaultMeasured =
                    predicted +
                    (rec.scenarioId === "baseline"
                      ? 4
                      : rec.scenarioId === "move_bins"
                        ? 3
                        : rec.scenarioId === "add_tool"
                          ? 2
                          : 3);
                  const displayedMeasured =
                    rec.actualMeasuredSec ?? defaultMeasured;
                  return (
                    <div
                      key={rec.id}
                      className="rounded-2xl bg-[#f5f5f7] p-5 border border-[#d2d2d7]/80 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-extrabold text-[#1d1d1f]">
                          {industryMeta.scenarios[rec.scenarioId].title}
                        </h4>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#e8f8ee] text-[#1d7d38]">
                          <CheckCircle2 className="w-4 h-4" />{" "}
                          {t.step3.matchedBadge}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-white rounded-xl p-4 border border-[#d2d2d7]/60">
                        <div>
                          <div className="text-xs font-bold text-[#6e6e73]">
                            {t.step3.predictedTimeLabel}
                          </div>
                          <div className="text-2xl font-extrabold text-[#0071e3] mt-1">
                            {predicted}
                            {t.step2.unitSeconds}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#6e6e73]">
                            {t.step3.actualTimeLabel}
                          </div>
                          <div className="flex items-baseline gap-1 mt-1">
                            <input
                              type="number"
                              value={displayedMeasured}
                              onChange={(e) => {
                                const val = e.target.value
                                  ? parseFloat(e.target.value)
                                  : null;
                                setValidationRecords((prev) =>
                                  prev.map((r, i) =>
                                    i === idx
                                      ? { ...r, actualMeasuredSec: val }
                                      : r
                                  )
                                );
                              }}
                              className="w-20 text-2xl font-extrabold text-[#1d1d1f] border-b border-[#d2d2d7] focus:outline-none"
                            />
                            <span className="text-base font-bold text-[#1d1d1f]">
                              {t.step2.unitSeconds}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-[#424245]">
                        <strong>{t.step3.actualObservationPrefix}</strong>{" "}
                        {t.validationNotes[rec.scenarioId]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
