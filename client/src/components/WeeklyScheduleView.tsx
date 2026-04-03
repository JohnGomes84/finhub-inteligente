import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";

interface ScheduleCard {
  id: number;
  clientName: string;
  shiftName: string;
  allocatedCount: number;
}

interface WeeklyScheduleViewProps {
  schedulesByDay: Record<string, ScheduleCard[]>;
  onScheduleClick: (scheduleId: number) => void;
  onDayClick: (date: string) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  weekStart: Date;
}

export function WeeklyScheduleView({
  schedulesByDay,
  onScheduleClick,
  onDayClick,
  onPreviousWeek,
  onNextWeek,
  weekStart,
}: WeeklyScheduleViewProps) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onPreviousWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold">
          {weekStart.toLocaleDateString("pt-BR", { month: "short", day: "numeric" })} -{" "}
          {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR", {
            month: "short",
            day: "numeric",
          })}
        </span>
        <Button variant="outline" size="sm" onClick={onNextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((date, idx) => {
          const dateStr = date.toISOString().split("T")[0];
          const schedules = schedulesByDay[dateStr] || [];
          const isToday =
            new Date().toISOString().split("T")[0] === dateStr;

          return (
            <div key={dateStr} className="space-y-2">
              <div
                className={`text-center p-2 rounded-lg border-2 ${
                  isToday
                    ? "border-primary bg-primary/10"
                    : "border-border/50 bg-muted/30"
                }`}
              >
                <p className="text-xs font-semibold text-muted-foreground">
                  {dayNames[idx]}
                </p>
                <p className="text-sm font-bold">{date.getDate()}</p>
              </div>

              <div className="space-y-1 min-h-32">
                {schedules.length === 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-24 flex items-center justify-center text-xs"
                    onClick={() => onDayClick(dateStr)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Novo
                  </Button>
                ) : (
                  schedules.map((schedule) => (
                    <Card
                      key={schedule.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors bg-slate-800 border-slate-700"
                      onClick={() => onScheduleClick(schedule.id)}
                    >
                      <CardContent className="p-2">
                        <p className="text-xs font-semibold text-white truncate">
                          {schedule.clientName}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {schedule.shiftName}
                        </p>
                        <p className="text-[10px] text-blue-400 font-medium">
                          {schedule.allocatedCount} diaristas
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
