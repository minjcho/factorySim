"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  IndustryPresetId,
  SimulationTickSnapshot,
  StationNode,
} from "@/types/simulation";
import { ko, type LocaleMessages } from "@/locales";

interface WorkshopCanvasProps {
  stations: StationNode[];
  snapshot: SimulationTickSnapshot;
  viewMode: "2d" | "3d";
  editable?: boolean;
  onStationMove?: (id: string, x: number, y: number) => void;
  focusedStationId?: string | null;
  compact?: boolean;
  titleBadge?: string;
  t?: LocaleMessages;
  industryId?: IndustryPresetId;
}

const GRID_W = 12.0;
const GRID_H = 8.0;

export default function WorkshopCanvas({
  stations,
  snapshot,
  viewMode,
  editable = false,
  onStationMove,
  focusedStationId = null,
  compact = false,
  titleBadge,
  t = ko,
  industryId = "cnc_metal_shop",
}: WorkshopCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [cameraYaw, setCameraYaw] = useState<number>(0.62);
  const pulsePhase = snapshot.time;

  const toScreen2D = (gx: number, gy: number, width: number, height: number) => {
    const padX = compact ? 16 : 24;
    const padY = compact ? 28 : 48;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;
    return {
      x: padX + (gx / GRID_W) * usableW,
      y: padY + (gy / GRID_H) * usableH,
    };
  };

  const fromScreen2D = (sx: number, sy: number, width: number, height: number) => {
    const padX = compact ? 16 : 24;
    const padY = compact ? 28 : 48;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;
    const gx = Math.max(
      1.0,
      Math.min(GRID_W - 1.0, ((sx - padX) / usableW) * GRID_W)
    );
    const gy = Math.max(
      1.0,
      Math.min(GRID_H - 1.0, ((sy - padY) / usableH) * GRID_H)
    );
    return { x: Number(gx.toFixed(2)), y: Number(gy.toFixed(2)) };
  };

  const toScreen3D = (
    gx: number,
    gy: number,
    gz: number,
    width: number,
    height: number
  ) => {
    const cx = gx - GRID_W / 2;
    const cy = gy - GRID_H / 2;
    const cosA = Math.cos(cameraYaw);
    const sinA = Math.sin(cameraYaw);
    const rx = cx * cosA - cy * sinA;
    const ry = cx * sinA + cy * cosA;

    const scale = compact
      ? Math.min(width, height) / 10.5
      : Math.min(width, height) / 9.2;
    const isoX = width * 0.5 + rx * scale * 1.12;
    const isoY = height * 0.56 + ry * scale * 0.58 - gz * scale * 0.85;
    return { x: isoX, y: isoY, scale };
  };

  const getStationLabel = (st: StationNode) => {
    const indMap = t.industries[industryId]?.stationNames;
    const key = st.id as keyof typeof t.canvas.stationNames;
    return indMap?.[key] ?? t.canvas.stationNames[key] ?? st.label;
  };

  const getAgentTag = (ag: SimulationTickSnapshot["agents"][number]) => {
    const key = ag.id as keyof typeof t.canvas.agentTags;
    return t.canvas.agentTags[key] ?? ag.name;
  };

  const getLocalizedBubble = (ag: SimulationTickSnapshot["agents"][number]) => {
    if (ag.role === "transport_robot") {
      return ag.state === "IDLE"
        ? t.canvas.bubbles.idle
        : t.canvas.bubbles.robotDelivering;
    }
    switch (ag.state) {
      case "WAITING_FOR_TOOL":
        return t.canvas.bubbles.waitingTool;
      case "PRE_PICKING_NEXT":
        return t.canvas.bubbles.prePicking;
      case "CHANGEOVER_SETUP":
        return t.canvas.bubbles.changeover;
      case "REWORK_REPAIR":
        return t.canvas.bubbles.rework;
      case "PRE_ASSEMBLING":
        return t.canvas.bubbles.assembling;
      case "USING_TOOL":
      case "MOVING_TO_TOOL":
        return t.canvas.bubbles.usingTool;
      case "INSPECTING_PACKING":
        return t.canvas.bubbles.inspecting;
      case "MOVING_TO_BIN":
      case "PICKING_PARTS":
        return t.canvas.bubbles.movingToBin;
      case "MOVING_TO_WB":
        return t.canvas.bubbles.movingToWb;
      case "DELIVERING_TO_INSPECT":
        return t.canvas.bubbles.delivering;
      default:
        return t.canvas.bubbles.idle;
    }
  };

  const getLocalizedHighlightBanner = (): string | null => {
    const toolWaiters = snapshot.agents.filter(
      (a) => a.state === "WAITING_FOR_TOOL"
    ).length;
    const inspectWip = snapshot.inspectQueueItems.length;
    if (toolWaiters > 0 && inspectWip >= 2) {
      return t.canvas.banners.bothCongested(toolWaiters, inspectWip);
    }
    if (toolWaiters > 0) {
      return t.canvas.banners.toolCongested;
    }
    if (inspectWip >= 2) {
      return t.canvas.banners.inspectCongested(inspectWip);
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!editable || !onStationMove || viewMode !== "2d") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    for (const st of stations) {
      const pos = toScreen2D(st.x, st.y, rect.width, rect.height);
      if (Math.hypot(sx - pos.x, sy - pos.y) <= 40) {
        if (st.fixed) {
          setHoveredId(st.id);
          return;
        }
        setDraggingId(st.id);
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (draggingId && editable && onStationMove && viewMode === "2d") {
      const gridPos = fromScreen2D(sx, sy, rect.width, rect.height);
      onStationMove(draggingId, gridPos.x, gridPos.y);
      return;
    }

    if (viewMode === "2d") {
      let found: string | null = null;
      for (const st of stations) {
        const pos = toScreen2D(st.x, st.y, rect.width, rect.height);
        if (Math.hypot(sx - pos.x, sy - pos.y) <= 40) {
          found = st.id;
          break;
        }
      }
      setHoveredId(found);
    }
  };

  const handlePointerUp = () => {
    setDraggingId(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;

    // Clean Apple Studio Light Background
    ctx.fillStyle = "#fafafc";
    ctx.fillRect(0, 0, W, H);

    if (viewMode === "2d") {
      draw2DFloorplan(ctx, W, H);
    } else {
      draw3DIsometric(ctx, W, H);
    }
  });

  function draw2DFloorplan(ctx: CanvasRenderingContext2D, W: number, H: number) {
    // Soft grid lines
    ctx.strokeStyle = "#e8e8ed";
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= 12; gx++) {
      const p1 = toScreen2D(gx, 0, W, H);
      const p2 = toScreen2D(gx, GRID_H, W, H);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    for (let gy = 0; gy <= 8; gy++) {
      const p1 = toScreen2D(0, gy, W, H);
      const p2 = toScreen2D(GRID_W, gy, W, H);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Flow lines
    const binA = stations.find((s) => s.id === "binA");
    const binB = stations.find((s) => s.id === "binB");
    const wb1 = stations.find((s) => s.id === "wb1");
    const wb2 = stations.find((s) => s.id === "wb2");
    const wb3 = stations.find((s) => s.id === "wb3");
    const tool1 = stations.find((s) => s.id === "tool1");
    const tool2 = stations.find((s) => s.id === "tool2");

    const drawFlowLine = (
      a: StationNode | undefined,
      b: StationNode | undefined,
      showDistLabel: boolean
    ) => {
      if (!a || !b) return;
      const p1 = toScreen2D(a.x, a.y, W, H);
      const p2 = toScreen2D(b.x, b.y, W, H);
      ctx.save();
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      if (showDistLabel && !compact) {
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        const walkSec = Math.max(1, Math.round(d / 1.55));
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        const labelY = my - 35;
        ctx.setLineDash([]);
        ctx.fillStyle = "#ffffff";
        roundRect(ctx, mx - 42, labelY - 10, 84, 20, 10);
        ctx.fill();
        ctx.strokeStyle = "#d2d2d7";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "#424245";
        ctx.font = "600 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(t.canvas.walkTimeApprox(walkSec), mx, labelY + 4);
      }
      ctx.restore();
    };

    drawFlowLine(binA, wb1, true);
    drawFlowLine(binB, wb2, true);
    if (tool2) {
      drawFlowLine(wb1, tool1, false);
      drawFlowLine(wb2, tool2, false);
      drawFlowLine(tool1, wb3, false);
      drawFlowLine(tool2, wb3, false);
    } else {
      drawFlowLine(wb1, tool1, false);
      drawFlowLine(wb2, tool1, false);
      drawFlowLine(tool1, wb3, false);
    }

    const stationBoxes: {
      id: string;
      x: number;
      y: number;
      w: number;
      h: number;
    }[] = [];

    // Stations
    for (const st of stations) {
      const pos = toScreen2D(st.x, st.y, W, H);
      const q = snapshot.stationQueues[st.id];
      const isFocused = focusedStationId === st.id;
      const isCongested = q?.isCongested;

      if (isCongested || isFocused) {
        const radius =
          (compact ? 32 : 46) + Math.sin(pulsePhase * 5) * (compact ? 3 : 6);
        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 59, 48, 0.14)";
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#ff3b30";
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.font = compact ? "700 10px sans-serif" : "700 12px sans-serif";
      const labelStr = getStationLabel(st);
      const measuredW = ctx.measureText(labelStr).width + (compact ? 14 : 20);
      const boxW = Math.max(compact ? 66 : 88, measuredW);
      const boxH = compact ? 36 : 44;
      stationBoxes.push({ id: st.id, x: pos.x, y: pos.y, w: boxW, h: boxH });

      // Soft Apple Card Shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.06)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 3;

      ctx.fillStyle = getLightStationFill(st.type, Boolean(isCongested));
      ctx.strokeStyle =
        hoveredId === st.id || draggingId === st.id
          ? "#0071e3"
          : isCongested || isFocused
            ? "#ff3b30"
            : getLightStationBorder(st.type);
      ctx.lineWidth = isFocused || isCongested ? 3 : 2;

      roundRect(ctx, pos.x - boxW / 2, pos.y - boxH / 2, boxW, boxH, 12);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.stroke();

      const subText = !compact
        ? st.fixed
          ? t.canvas.fixedSubLabel
          : editable
            ? t.canvas.draggableSubLabel
            : st.type === "shared_tool"
              ? t.canvas.sharedToolSubLabel
              : ""
        : "";

      ctx.fillStyle = "#1d1d1f";
      ctx.font = compact ? "700 10px sans-serif" : "700 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        labelStr,
        pos.x,
        subText ? pos.y - 3 : pos.y + (compact ? 3.5 : 4.5)
      );

      if (subText) {
        ctx.fillStyle = st.fixed ? "#d70015" : "#86868b";
        ctx.font = "600 10px sans-serif";
        ctx.fillText(subText, pos.x, pos.y + 11);
      }

      // Stacked items waiting at Workbench 3
      if (st.id === "wb3" && snapshot.inspectQueueItems.length > 0) {
        const count = snapshot.inspectQueueItems.length;
        ctx.fillStyle = count >= 2 ? "#ff3b30" : "#ff9500";
        roundRect(ctx, pos.x - 42, pos.y - boxH / 2 - 23, 84, 18, 9);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 11px sans-serif";
        ctx.fillText(
          t.canvas.queuedItemsBadge(count),
          pos.x,
          pos.y - boxH / 2 - 10
        );
      }

      ctx.restore();
    }

    // Track how many agents are docked at each station so they don't stack on top of each other
    const stationDockCount = new Map<string, number>();

    // Workers & Robot
    for (const ag of snapshot.agents) {
      const rawPos = toScreen2D(ag.x, ag.y, W, H);
      let drawX = rawPos.x;
      let drawY = rawPos.y;
      let overlappedSb: (typeof stationBoxes)[number] | null = null;

      for (const sb of stationBoxes) {
        if (
          Math.abs(rawPos.x - sb.x) < sb.w / 2 + 12 &&
          Math.abs(rawPos.y - sb.y) < sb.h / 2 + 14
        ) {
          overlappedSb = sb;
          break;
        }
      }

      if (overlappedSb) {
        const dockIdx = stationDockCount.get(overlappedSb.id) ?? 0;
        stationDockCount.set(overlappedSb.id, dockIdx + 1);
        drawX =
          dockIdx === 0
            ? overlappedSb.x
            : overlappedSb.x + (dockIdx % 2 === 1 ? 26 : -26);
        drawY = overlappedSb.y + overlappedSb.h / 2 + (compact ? 8 : 11);
      }

      ctx.save();

      const isRobot = ag.role === "transport_robot";
      const isSetup = ag.state === "CHANGEOVER_SETUP";
      const isRework = ag.state === "REWORK_REPAIR";
      const isPrePick = ag.state === "PRE_PICKING_NEXT";
      const showHighlightBubble =
        ag.isWaitingBottleneck || isSetup || isRework || isPrePick;
      const radius = compact ? 13 : 16;

      ctx.shadowColor = "rgba(0,0,0,0.14)";
      ctx.shadowBlur = 7;
      ctx.shadowOffsetY = 2;

      ctx.beginPath();
      ctx.arc(drawX, drawY, radius, 0, Math.PI * 2);
      ctx.fillStyle = isRobot
        ? "#007aff"
        : ag.isWaitingBottleneck || isRework
          ? "#ff3b30"
          : isSetup
            ? "#f59e0b"
            : ag.role === "inspector"
              ? "#34c759"
              : "#5856d6";
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = compact ? "700 9.5px sans-serif" : "700 10.5px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(getAgentTag(ag), drawX, drawY + 3.5);

      if (!compact && showHighlightBubble) {
        const text = getLocalizedBubble(ag);
        ctx.font = "700 11px sans-serif";
        const tw = Math.min(210, ctx.measureText(text).width + 18);
        const bx = Math.max(10, Math.min(W - tw - 10, drawX - tw / 2));
        const by =
          drawY + radius + 28 < H - 40
            ? drawY + radius + 5
            : (overlappedSb
                ? overlappedSb.y - overlappedSb.h / 2
                : drawY - radius) - 25;

        ctx.fillStyle =
          ag.isWaitingBottleneck || isRework
            ? "#ff3b30"
            : isSetup
              ? "#d97706"
              : "#0071e3";
        roundRect(ctx, bx, by, tw, 20, 10);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(text, bx + tw / 2, by + 14);
      }

      ctx.restore();
    }
  }

  function draw3DIsometric(ctx: CanvasRenderingContext2D, W: number, H: number) {
    // 1. Bright Isometric Floor Tiles
    for (let gx = 0; gx < 12; gx++) {
      for (let gy = 0; gy < 8; gy++) {
        const p0 = toScreen3D(gx, gy, 0, W, H);
        const p1 = toScreen3D(gx + 1, gy, 0, W, H);
        const p2 = toScreen3D(gx + 1, gy + 1, 0, W, H);
        const p3 = toScreen3D(gx, gy + 1, 0, W, H);

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();

        ctx.fillStyle = (gx + gy) % 2 === 0 ? "#ffffff" : "#f2f2f7";
        ctx.fill();
        ctx.strokeStyle = "#e5e5ea";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    const cosA = Math.cos(cameraYaw);
    const sinA = Math.sin(cameraYaw);
    const depthOf = (x: number, y: number) => x * sinA + y * cosA;

    type RenderItem =
      | { kind: "station"; depth: number; st: StationNode }
      | {
          kind: "agent";
          depth: number;
          ag: SimulationTickSnapshot["agents"][number];
        };

    const items: RenderItem[] = [
      ...stations.map((st) => ({
        kind: "station" as const,
        depth: depthOf(st.x, st.y),
        st,
      })),
      ...snapshot.agents.map((ag) => ({
        kind: "agent" as const,
        depth: depthOf(ag.x, ag.y) + 0.15,
        ag,
      })),
    ];

    items.sort((a, b) => a.depth - b.depth);

    for (const item of items) {
      if (item.kind === "station") {
        draw3DStation(ctx, item.st, W, H);
      } else {
        draw3DAgent(ctx, item.ag, W, H);
      }
    }
  }

  function draw3DStation(
    ctx: CanvasRenderingContext2D,
    st: StationNode,
    W: number,
    H: number
  ) {
    const q = snapshot.stationQueues[st.id];
    const isCongested = q?.isCongested;
    const isFocused = focusedStationId === st.id;
    const base = toScreen3D(st.x, st.y, 0, W, H);

    if (isCongested || isFocused) {
      const r = (compact ? 30 : 44) + Math.sin(pulsePhase * 6) * 5;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(base.x, base.y, r * 1.25, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 59, 48, 0.18)";
      ctx.fill();
      ctx.strokeStyle = "#ff3b30";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    const sx = st.type === "shared_tool" ? 0.52 : 0.78;
    const sy = st.type === "shared_tool" ? 0.52 : 0.58;
    const sz =
      st.type === "part_bin" ? 0.75 : st.type === "shared_tool" ? 0.62 : 0.52;

    const colors = getLight3DStationColors(st.type, Boolean(isCongested));
    drawIsoCuboid(ctx, st.x, st.y, 0, sx, sy, sz, colors, W, H);

    if (st.id === "wb3" && snapshot.inspectQueueItems.length > 0) {
      snapshot.inspectQueueItems.forEach((wip, idx) => {
        const stackZ = 0.52 + idx * 0.24;
        const boxColors =
          wip.productId === "productA"
            ? { top: "#60a5fa", left: "#3b82f6", right: "#2563eb" }
            : { top: "#fbbf24", left: "#f59e0b", right: "#d97706" };
        drawIsoCuboid(
          ctx,
          st.x - 0.28,
          st.y,
          stackZ,
          0.28,
          0.28,
          0.2,
          boxColors,
          W,
          H
        );
      });
    }

    const topPos = toScreen3D(st.x, st.y, sz + 0.38, W, H);
    ctx.save();
    ctx.font = compact ? "700 11px sans-serif" : "700 13px sans-serif";
    ctx.textAlign = "center";
    const labelText = getStationLabel(st);
    const tw = ctx.measureText(labelText).width + 18;
    ctx.fillStyle = isCongested ? "#ff3b30" : "#ffffff";
    roundRect(ctx, topPos.x - tw / 2, topPos.y - 12, tw, 22, 11);
    ctx.fill();
    ctx.strokeStyle = isCongested ? "#ff3b30" : "#d2d2d7";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = isCongested ? "#ffffff" : "#1d1d1f";
    ctx.fillText(labelText, topPos.x, topPos.y + 3);
    ctx.restore();
  }

  function draw3DAgent(
    ctx: CanvasRenderingContext2D,
    ag: SimulationTickSnapshot["agents"][number],
    W: number,
    H: number
  ) {
    const isRobot = ag.role === "transport_robot";
    const isSetup = ag.state === "CHANGEOVER_SETUP";
    const isRework = ag.state === "REWORK_REPAIR";
    const isPrePick = ag.state === "PRE_PICKING_NEXT";
    const showHighlightBubble =
      ag.isWaitingBottleneck || isSetup || isRework || isPrePick;
    if (isRobot) {
      drawIsoCuboid(
        ctx,
        ag.x,
        ag.y,
        0.05,
        0.44,
        0.44,
        0.34,
        { top: "#38bdf8", left: "#0284c7", right: "#0369a1" },
        W,
        H
      );
    } else {
      const bodyColors =
        ag.isWaitingBottleneck || isRework
          ? { top: "#ff6961", left: "#ff3b30", right: "#d70015" }
          : isSetup
            ? { top: "#fbbf24", left: "#f59e0b", right: "#d97706" }
            : ag.role === "inspector"
              ? { top: "#4cd964", left: "#34c759", right: "#248a3d" }
              : { top: "#7d7aff", left: "#5856d6", right: "#3634a3" };

      drawIsoCuboid(ctx, ag.x, ag.y, 0, 0.32, 0.32, 0.7, bodyColors, W, H);

      const headPos = toScreen3D(ag.x, ag.y, 0.85, W, H);
      ctx.save();
      ctx.beginPath();
      ctx.arc(headPos.x, headPos.y, compact ? 6 : 8, 0, Math.PI * 2);
      ctx.fillStyle = "#ffcc00";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    const bubblePos = toScreen3D(ag.x, ag.y, 1.24, W, H);
    if (!compact && showHighlightBubble) {
      ctx.save();
      const text = getLocalizedBubble(ag);
      ctx.font = "700 11.5px sans-serif";
      const tw = Math.min(220, ctx.measureText(text).width + 20);
      const bx = Math.max(10, Math.min(W - tw - 10, bubblePos.x - tw / 2));
      const by = bubblePos.y - 20;

      ctx.fillStyle =
        ag.isWaitingBottleneck || isRework
          ? "#ff3b30"
          : isSetup
            ? "#d97706"
            : "#0071e3";
      roundRect(ctx, bx, by, tw, 22, 11);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(text, bx + tw / 2, by + 15);
      ctx.restore();
    }
  }

  function drawIsoCuboid(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    cz: number,
    rx: number,
    ry: number,
    hz: number,
    colors: { top: string; left: string; right: string },
    W: number,
    H: number
  ) {
    const x0 = cx - rx / 2;
    const x1 = cx + rx / 2;
    const y0 = cy - ry / 2;
    const y1 = cy + ry / 2;
    const z0 = cz;
    const z1 = cz + hz;

    const b01 = toScreen3D(x0, y1, z0, W, H);
    const b10 = toScreen3D(x1, y0, z0, W, H);
    const b11 = toScreen3D(x1, y1, z0, W, H);

    const t00 = toScreen3D(x0, y0, z1, W, H);
    const t10 = toScreen3D(x1, y0, z1, W, H);
    const t11 = toScreen3D(x1, y1, z1, W, H);
    const t01 = toScreen3D(x0, y1, z1, W, H);

    ctx.save();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(b01.x, b01.y);
    ctx.lineTo(b11.x, b11.y);
    ctx.lineTo(t11.x, t11.y);
    ctx.lineTo(t01.x, t01.y);
    ctx.closePath();
    ctx.fillStyle = colors.left;
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(b10.x, b10.y);
    ctx.lineTo(b11.x, b11.y);
    ctx.lineTo(t11.x, t11.y);
    ctx.lineTo(t10.x, t10.y);
    ctx.closePath();
    ctx.fillStyle = colors.right;
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(t00.x, t00.y);
    ctx.lineTo(t10.x, t10.y);
    ctx.lineTo(t11.x, t11.y);
    ctx.lineTo(t01.x, t01.y);
    ctx.closePath();
    ctx.fillStyle = colors.top;
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  const localizedBanner = getLocalizedHighlightBanner();

  return (
    <div className="relative w-full h-full select-none rounded-2xl overflow-hidden border border-[#d2d2d7] bg-[#fafafc]">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`w-full h-full block ${
          editable && viewMode === "2d" ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      />

      {/* Simple Top Overlay */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          {titleBadge && (
            <span className="px-3.5 py-1.5 rounded-full text-sm font-bold bg-white/95 text-[#1d1d1f] border border-[#d2d2d7] shadow-sm">
              {titleBadge}
            </span>
          )}
          <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-white/95 text-[#0071e3] border border-[#d2d2d7] shadow-sm">
            {t.canvas.progressOverlay(
              Math.round(snapshot.time),
              snapshot.completedCount
            )}
          </span>
        </div>

        {viewMode === "3d" && !compact && (
          <div className="pointer-events-auto flex items-center gap-2 bg-white/95 border border-[#d2d2d7] rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#1d1d1f] shadow-sm">
            <span>{t.canvas.rotate3DLabel}</span>
            <input
              type="range"
              min="0.25"
              max="1.25"
              step="0.02"
              value={cameraYaw}
              onChange={(e) => setCameraYaw(parseFloat(e.target.value))}
              className="w-20 accent-[#0071e3] cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Friendly Alert Banner inside canvas when bottlenecked */}
      {localizedBanner && !compact && (
        <div className="absolute bottom-3 left-4 right-4 flex justify-center pointer-events-none">
          <div className="px-4 py-2 rounded-full bg-[#ff3b30] text-white text-sm font-bold shadow-md">
            {localizedBanner}
          </div>
        </div>
      )}
    </div>
  );
}

function getLightStationFill(
  type: StationNode["type"],
  isCongested: boolean
): string {
  if (isCongested) return "#fff2f2";
  switch (type) {
    case "part_bin":
      return "#eef6ff";
    case "workbench_assembly":
      return "#ffffff";
    case "shared_tool":
      return "#f5f0ff";
    case "workbench_inspect":
      return "#edfaf1";
    case "robot_dock":
      return "#ecfeff";
    case "shipping_out":
      return "#f5f5f7";
  }
}

function getLightStationBorder(type: StationNode["type"]): string {
  switch (type) {
    case "part_bin":
      return "#0071e3";
    case "workbench_assembly":
      return "#86868b";
    case "shared_tool":
      return "#8e44ad";
    case "workbench_inspect":
      return "#28cd41";
    case "robot_dock":
      return "#00c7be";
    case "shipping_out":
      return "#aeaeb2";
  }
}

function getLight3DStationColors(
  type: StationNode["type"],
  isCongested: boolean
): { top: string; left: string; right: string } {
  if (isCongested) {
    return { top: "#ff6961", left: "#ff3b30", right: "#d70015" };
  }
  switch (type) {
    case "part_bin":
      return { top: "#66b2ff", left: "#0071e3", right: "#005bb5" };
    case "workbench_assembly":
      return { top: "#ffffff", left: "#e5e5ea", right: "#d1d1d6" };
    case "shared_tool":
      return { top: "#bf5af2", left: "#af52de", right: "#8944ab" };
    case "workbench_inspect":
      return { top: "#63e682", left: "#34c759", right: "#248a3d" };
    case "robot_dock":
      return { top: "#5ac8fa", left: "#32ade6", right: "#0071e3" };
    case "shipping_out":
      return { top: "#e5e5ea", left: "#d1d1d6", right: "#aeaeb2" };
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
