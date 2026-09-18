import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  BatteryCharging,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Cpu,
  Gauge,
  Loader2,
  Moon,
  Play,
  Plus,
  RefreshCcw,
  Server,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Zap,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";


const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";


const demandProfile = [
  100, 100, 100, 100, 100, 100,
  100, 100, 100, 100, 100, 100,
  100, 100, 100, 100, 100, 100,
  100, 100, 100, 100, 100, 100,
];

const solarProfile = [
  0, 0, 0, 0, 0, 0,
  0, 0, 50, 50, 50, 50,
  50, 50, 50, 50, 50, 0,
  0, 0, 0, 0, 0, 0,
];

const tariffProfile = [
  5, 5, 5, 5, 5, 5,
  10, 10, 10, 10, 10, 10,
  10, 10, 10, 10, 10, 20,
  20, 20, 20, 20, 10, 10,
];


function createHours() {
  return Array.from(
    { length: 24 },
    (_, hour) => ({
      hour,
      demand_kwh: demandProfile[hour],
      solar_kwh: solarProfile[hour],
      tariff_bdt_per_kwh: tariffProfile[hour],
    })
  );
}


function createDemoScenario() {
  return {
    scenario_id: "CAMPUSGRID-DEMO-001",

    operator_notes: [
      "Expect an 80% reduction in rooftop solar from 1 PM until 3 PM.",
      "The cafeteria will introduce a new menu next week.",
    ],

    hours: createHours(),

    battery: {
      capacity_kwh: 200,
      initial_energy_kwh: 100,
      minimum_energy_kwh: 40,
      max_charge_kwh_per_hour: 50,
      max_discharge_kwh_per_hour: 50,
    },
  };
}


const inputClass = `
  w-full
  rounded-xl
  border
  border-white/10
  bg-white/[0.045]
  px-3.5
  py-2.5
  text-sm
  font-medium
  text-white
  outline-none
  transition
  placeholder:text-white/25
  hover:border-white/20
  focus:border-[#8CFF00]/60
  focus:bg-white/[0.065]
  focus:ring-4
  focus:ring-[#8CFF00]/10
`;


const hiddenScrollbar = `
  [scrollbar-width:none]
  [&::-webkit-scrollbar]:hidden
`;


const premiumScrollbar = `
  [scrollbar-width:thin]
  [scrollbar-color:#243020_transparent]
  [&::-webkit-scrollbar]:w-1.5
  [&::-webkit-scrollbar]:h-1.5
  [&::-webkit-scrollbar-track]:bg-transparent
  [&::-webkit-scrollbar-thumb]:rounded-full
  [&::-webkit-scrollbar-thumb]:bg-white/10
  [&::-webkit-scrollbar-thumb:hover]:bg-[#8CFF00]/35
`;


function FieldLabel({
  children,
  right,
}) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <label className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
        {children}
      </label>

      {right && (
        <span className="text-[9px] font-medium text-white/25">
          {right}
        </span>
      )}
    </div>
  );
}


function StatusDot({
  online,
}) {
  return (
    <span className="relative flex h-2.5 w-2.5">

      {online && (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8CFF00] opacity-40" />
      )}

      <span
        className={`
          relative
          inline-flex
          h-2.5
          w-2.5
          rounded-full

          ${
            online
              ? "bg-[#8CFF00] shadow-[0_0_12px_rgba(140,255,0,0.85)]"
              : "bg-red-500"
          }
        `}
      />

    </span>
  );
}


function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  caption,
}) {
  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-[22px]
        border
        border-white/[0.08]
        bg-white/[0.035]
        p-5
        backdrop-blur-xl
        transition
        duration-300
        hover:-translate-y-0.5
        hover:border-[#8CFF00]/25
        hover:bg-white/[0.05]
        hover:shadow-[0_18px_60px_rgba(0,0,0,0.35)]
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          -right-10
          -top-12
          h-32
          w-32
          rounded-full
          bg-[#8CFF00]/10
          blur-3xl
          transition
          duration-500
          group-hover:bg-[#8CFF00]/15
        "
      />

      <div className="relative z-10">

        <div className="mb-5 flex items-start justify-between">

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
              {title}
            </p>

            <p className="mt-1 text-[10px] text-white/20">
              {caption}
            </p>
          </div>

          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              border
              border-[#8CFF00]/15
              bg-[#8CFF00]/10
              text-[#9BFF19]
            "
          >
            <Icon size={17} />
          </div>

        </div>


        <div className="flex items-end gap-2">

          <span className="text-[30px] font-black tracking-[-0.04em] text-white">
            {value}
          </span>

          {unit && (
            <span className="mb-1 text-[10px] font-bold uppercase tracking-wide text-white/35">
              {unit}
            </span>
          )}

        </div>

      </div>
    </div>
  );
}


function PipelineItem({
  icon: Icon,
  label,
  number,
}) {
  return (
    <div className="flex items-center gap-2.5">

      <div
        className="
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-xl
          border
          border-[#8CFF00]/15
          bg-[#8CFF00]/[0.07]
          text-[#9BFF19]
        "
      >
        <Icon size={14} />
      </div>

      <div className="hidden 2xl:block">

        <div className="text-[8px] font-black uppercase tracking-[0.18em] text-white/20">
          {number}
        </div>

        <div className="text-[10px] font-bold text-white/70">
          {label}
        </div>

      </div>

    </div>
  );
}


function ChartTooltip({
  active,
  payload,
  label,
  bright = false,
}) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }

  return (
    <div
      className={`
        min-w-[160px]
        rounded-2xl
        border
        p-3
        shadow-2xl
        backdrop-blur-xl
        ${
          bright
            ? "border-black/10 bg-white/95"
            : "border-white/10 bg-[#080D09]/95"
        }
      `}
    >

      <p
        className={`mb-2 text-[10px] font-black uppercase tracking-widest ${
          bright ? "text-[#4F8F00]" : "text-[#9BFF19]"
        }`}
      >
        {label}
      </p>

      <div className="space-y-1.5">

        {payload.map(
          (entry) => (
            <div
              key={entry.dataKey}
              className="flex items-center justify-between gap-5"
            >
              <span
                className={`text-[10px] ${
                  bright ? "text-black/50" : "text-white/45"
                }`}
              >
                {entry.name}
              </span>

              <span
                className={`text-[10px] font-bold ${
                  bright ? "text-black" : "text-white"
                }`}
              >
                {Number(
                  entry.value
                ).toFixed(1)}
              </span>
            </div>
          )
        )}

      </div>

    </div>
  );
}


function BatteryField({
  label,
  value,
  onChange,
  wide = false,
}) {
  return (
    <div
      className={`
        rounded-2xl
        border
        border-white/[0.07]
        bg-white/[0.025]
        p-3
        transition
        hover:border-white/15

        ${
          wide
            ? "col-span-2"
            : ""
        }
      `}
    >
      <div className="mb-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/30">
        {label}
      </div>

      <div className="flex items-end justify-between gap-2">

        <input
          type="number"
          value={value}
          onChange={onChange}
          className="
            min-w-0
            flex-1
            border-0
            bg-transparent
            text-lg
            font-black
            text-white
            outline-none

            appearance-none
            [appearance:textfield]

            [&::-webkit-inner-spin-button]:appearance-none
            [&::-webkit-inner-spin-button]:m-0
            [&::-webkit-outer-spin-button]:appearance-none
            [&::-webkit-outer-spin-button]:m-0
          "
        />

        <span className="mb-1 text-[8px] font-bold uppercase text-white/20">
          kWh
        </span>

      </div>

    </div>
  );
}


function DirectiveCard({
  directive,
}) {
  const applied =
    directive.applies;

  return (
    <div
      className={`
        rounded-[22px]
        border
        p-4
        transition

        ${
          applied
            ? "border-[#8CFF00]/20 bg-[#8CFF00]/[0.045] shadow-[0_0_40px_rgba(140,255,0,0.035)]"
            : "border-white/[0.07] bg-white/[0.025]"
        }
      `}
    >

      <div className="mb-4 flex items-center justify-between">

        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">
          Operator Note {directive.note_index + 1}
        </span>

        {applied ? (
          <span
            className="
              inline-flex
              items-center
              gap-1.5
              rounded-full
              border
              border-[#8CFF00]/20
              bg-[#8CFF00]/10
              px-2.5
              py-1
              text-[8px]
              font-black
              uppercase
              tracking-widest
              text-[#A5FF36]
            "
          >
            <CheckCircle2 size={11} />
            Applied
          </span>
        ) : (
          <span
            className="
              rounded-full
              border
              border-white/10
              bg-white/[0.04]
              px-2.5
              py-1
              text-[8px]
              font-black
              uppercase
              tracking-widest
              text-white/35
            "
          >
            No Action
          </span>
        )}

      </div>


      <div className="mb-3 flex items-center gap-3">

        <div
          className={`
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl

            ${
              applied
                ? "bg-[#8CFF00] text-black shadow-[0_0_24px_rgba(140,255,0,0.22)]"
                : "bg-white/[0.06] text-white/35"
            }
          `}
        >
          {applied ? (
            <Zap size={16} />
          ) : (
            <BrainCircuit size={16} />
          )}
        </div>


        <div>

          <div className="text-[9px] uppercase tracking-wider text-white/25">
            Directive
          </div>

          <div className="text-sm font-black text-white">
            {directive.directive_type}
          </div>

        </div>

      </div>


      {directive.structured_adjustment && (
        <div
          className="
            mb-3
            overflow-hidden
            rounded-2xl
            border
            border-white/[0.07]
            bg-black/50
          "
        >

          <div className="flex items-center gap-1.5 border-b border-white/[0.05] px-3 py-2">

            <span className="h-1.5 w-1.5 rounded-full bg-[#8CFF00]/70" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/15" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/10" />

            <span className="ml-2 text-[8px] uppercase tracking-widest text-white/20">
              structured output
            </span>

          </div>

          <pre
            className={`
              overflow-x-auto
              p-3
              font-mono
              text-[10px]
              leading-5
              text-[#A7FF3D]

              ${premiumScrollbar}
            `}
          >
            {JSON.stringify(
              directive.structured_adjustment,
              null,
              2
            )}
          </pre>

        </div>
      )}


      <p className="text-[11px] leading-5 text-white/40">
        {directive.explanation}
      </p>

    </div>
  );
}


export default function App() {

  const [
    scenario,
    setScenario,
  ] = useState(
    createDemoScenario()
  );

  const [
    result,
    setResult,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    backendOnline,
    setBackendOnline,
  ] = useState(false);

  const [
    theme,
    setTheme,
  ] = useState(() => {

    if (typeof window === "undefined") {
      return "dark";
    }

    return window.localStorage.getItem(
      "campusgrid-theme"
    ) === "bright"
      ? "bright"
      : "dark";

  });

  const isBright =
    theme === "bright";


  useEffect(() => {

    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      "campusgrid-theme",
      theme
    );

    document.documentElement.style.colorScheme =
      isBright
        ? "light"
        : "dark";

  }, [theme, isBright]);


  useEffect(() => {

    async function checkHealth() {

      try {

        const response =
          await fetch(
            `${API_BASE}/health`
          );

        if (!response.ok) {
          throw new Error();
        }

        const data =
          await response.json();

        setBackendOnline(
          data.status === "ok"
        );

      } catch {

        setBackendOnline(false);

      }

    }

    checkHealth();

  }, []);


  const chartData =
    useMemo(() => {

      return scenario.hours.map(
        (
          hourData,
          index
        ) => {

          const plan =
            result
              ?.hourly_plan
              ?.[index];

          return {
            hour:
              `${String(
                hourData.hour
              ).padStart(
                2,
                "0"
              )}:00`,

            demand:
              hourData.demand_kwh,

            solar:
              hourData.solar_kwh,

            grid:
              plan?.grid_kwh ??
              null,

            battery:
              plan
                ?.battery_energy_after_kwh
              ?? null,
          };

        }
      );

    }, [
      scenario.hours,
      result,
    ]);


  const totalDemand =
    useMemo(
      () =>
        scenario.hours.reduce(
          (
            sum,
            hour
          ) =>
            sum +
            hour.demand_kwh,
          0
        ),
      [scenario.hours]
    );


  const totalSolar =
    useMemo(
      () =>
        scenario.hours.reduce(
          (
            sum,
            hour
          ) =>
            sum +
            hour.solar_kwh,
          0
        ),
      [scenario.hours]
    );


  function updateNote(
    index,
    value
  ) {

    setScenario(
      (
        previous
      ) => {

        const notes = [
          ...previous.operator_notes,
        ];

        notes[index] =
          value;

        return {
          ...previous,
          operator_notes:
            notes,
        };

      }
    );

  }


  function addNote() {

    if (
      scenario
        .operator_notes
        .length >= 3
    ) {
      return;
    }

    setScenario(
      (
        previous
      ) => ({
        ...previous,

        operator_notes: [
          ...previous.operator_notes,
          "",
        ],
      })
    );

  }


  function removeNote(
    index
  ) {

    if (
      scenario
        .operator_notes
        .length <= 1
    ) {
      return;
    }

    setScenario(
      (
        previous
      ) => ({
        ...previous,

        operator_notes:
          previous
            .operator_notes
            .filter(
              (
                _,
                noteIndex
              ) =>
                noteIndex !==
                index
            ),
      })
    );

  }


  function updateBattery(
    field,
    value
  ) {

    setScenario(
      (
        previous
      ) => ({
        ...previous,

        battery: {
          ...previous.battery,

          [field]:
            Number(value),
        },
      })
    );

  }


  function resetDemo() {

    setScenario(
      createDemoScenario()
    );

    setResult(null);
    setError("");

  }


  async function optimizeEnergy() {

    setLoading(true);
    setError("");

    try {

      const cleanNotes =
        scenario.operator_notes
          .map(
            (
              note
            ) =>
              note.trim()
          )
          .filter(Boolean);


      if (
        cleanNotes.length === 0
      ) {

        throw new Error(
          "Add at least one operator note."
        );

      }


      const response =
        await fetch(
          `${API_BASE}/optimize-energy`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                ...scenario,

                operator_notes:
                  cleanNotes,
              }),
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          typeof data.detail ===
          "string"
            ? data.detail
            : "Optimization failed."
        );

      }


      setResult(data);
      setBackendOnline(true);

    } catch (
      exception
    ) {

      setError(
        exception.message ||
        "Unable to connect to CampusGrid."
      );

    } finally {

      setLoading(false);

    }

  }


  return (
    <div
      className={`relative min-h-screen overflow-hidden transition-colors duration-300 ${
        isBright
          ? "bright-theme bg-[#F4F7F2] text-[#101510]"
          : "bg-[#030604] text-white"
      }`}
    >

      <style>{`
        .bright-theme [class~="text-white"] {
          color: #101510 !important;
        }

        .bright-theme [class~="text-white/75"],
        .bright-theme [class~="text-white/70"] {
          color: rgba(15, 23, 18, 0.76) !important;
        }

        .bright-theme [class~="text-white/65"],
        .bright-theme [class~="text-white/60"],
        .bright-theme [class~="text-white/55"] {
          color: rgba(15, 23, 18, 0.64) !important;
        }

        .bright-theme [class~="text-white/45"],
        .bright-theme [class~="text-white/40"],
        .bright-theme [class~="text-white/35"] {
          color: rgba(15, 23, 18, 0.50) !important;
        }

        .bright-theme [class~="text-white/30"],
        .bright-theme [class~="text-white/25"] {
          color: rgba(15, 23, 18, 0.40) !important;
        }

        .bright-theme [class~="text-white/20"],
        .bright-theme [class~="text-white/15"] {
          color: rgba(15, 23, 18, 0.30) !important;
        }

        .bright-theme .theme-keep-white {
          color: #FFFFFF !important;
        }

        .bright-theme [class~="border-white/10"],
        .bright-theme [class~="border-white/15"],
        .bright-theme [class~="border-white/20"],
        .bright-theme [class~="border-white/[0.035]"],
        .bright-theme [class~="border-white/[0.05]"],
        .bright-theme [class~="border-white/[0.06]"],
        .bright-theme [class~="border-white/[0.07]"],
        .bright-theme [class~="border-white/[0.08]"] {
          border-color: rgba(15, 23, 18, 0.10) !important;
        }

        .bright-theme [class~="bg-white/[0.015]"],
        .bright-theme [class~="bg-white/[0.018]"],
        .bright-theme [class~="bg-white/[0.02]"],
        .bright-theme [class~="bg-white/[0.025]"],
        .bright-theme [class~="bg-white/[0.03]"],
        .bright-theme [class~="bg-white/[0.035]"] {
          background-color: rgba(255, 255, 255, 0.58) !important;
        }

        .bright-theme [class~="bg-white/[0.04]"],
        .bright-theme [class~="bg-white/[0.045]"],
        .bright-theme [class~="bg-white/[0.05]"],
        .bright-theme [class~="bg-white/[0.06]"],
        .bright-theme [class~="bg-white/[0.065]"],
        .bright-theme [class~="bg-white/10"],
        .bright-theme [class~="bg-white/15"],
        .bright-theme [class~="bg-white/75"] {
          background-color: rgba(255, 255, 255, 0.78) !important;
        }

        .bright-theme [class~="bg-black/20"] {
          background-color: rgba(255, 255, 255, 0.46) !important;
        }

        .bright-theme [class~="bg-black/30"] {
          background-color: rgba(255, 255, 255, 0.62) !important;
        }

        .bright-theme [class~="bg-black/45"],
        .bright-theme [class~="bg-black/50"] {
          background-color: rgba(255, 255, 255, 0.82) !important;
        }

        .bright-theme [class~="bg-[#080C09]"] {
          background-color: #F7FAF6 !important;
        }

        .bright-theme [class~="bg-[#080D09]/95"] {
          background-color: rgba(255, 255, 255, 0.96) !important;
        }

        .bright-theme [class*="hover:bg-white"]:hover {
          background-color: rgba(255, 255, 255, 0.94) !important;
        }

        .bright-theme [class*="hover:text-white"]:hover {
          color: #0B130D !important;
        }

        .bright-theme [class*="focus:bg-white"]:focus {
          background-color: rgba(255, 255, 255, 0.96) !important;
        }

        .bright-theme [class~="text-[#8CFF00]"],
        .bright-theme [class~="text-[#9BFF19]"],
        .bright-theme [class~="text-[#A5FF36]"],
        .bright-theme [class~="text-[#A7FF3D]"] {
          color: #4F8F00 !important;
        }

        .bright-theme input,
        .bright-theme textarea {
          color: #101510 !important;
        }

        .bright-theme input::placeholder,
        .bright-theme textarea::placeholder {
          color: rgba(15, 23, 18, 0.30) !important;
        }

        .bright-theme table thead {
          background: rgba(247, 250, 246, 0.97) !important;
        }
      `}</style>

      {/* Background glow */}

      <div
        className="
          pointer-events-none
          fixed
          -left-40
          top-20
          h-[500px]
          w-[500px]
          rounded-full
          bg-[#8CFF00]/[0.045]
          blur-[140px]
        "
      />

      <div
        className="
          pointer-events-none
          fixed
          right-[15%]
          top-[-220px]
          h-[520px]
          w-[520px]
          rounded-full
          bg-[#8CFF00]/[0.06]
          blur-[150px]
        "
      />


      {/* HEADER */}

      <header
        className={`
          relative
          z-40
          flex
          min-h-[72px]
          items-center
          justify-between
          border-b
          px-5
          backdrop-blur-2xl
          transition-colors
          duration-300
          lg:px-7
          ${
            isBright
              ? "border-black/[0.08] bg-white/75"
              : "border-white/[0.07] bg-black/45"
          }
        `}
      >

        <div className="flex items-center gap-3.5">

          <div
            className="
              relative
              flex
              h-11
              w-11
              items-center
              justify-center
              overflow-hidden
              rounded-[15px]
              border
              border-white/15
              bg-black
              shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_0_28px_rgba(140,255,0,0.12)]
            "
          >

            <div
              className="
                absolute
                bottom-0
                h-[45%]
                w-full
                bg-gradient-to-t
                from-[#15FF00]
                via-[#8CFF00]
                to-[#B7FF35]
                opacity-90
              "
            />

            <Zap
              size={22}
              strokeWidth={2.4}
              className="theme-keep-white relative z-10 text-white drop-shadow-[0_3px_4px_rgba(0,0,0,0.7)]"
            />

          </div>


          <div>

            <div className="flex items-center gap-2">

              <h1 className="text-[19px] font-black tracking-[-0.03em]">
                CampusGrid
              </h1>

              <span
                className="
                  rounded-full
                  border
                  border-[#8CFF00]/20
                  bg-[#8CFF00]/10
                  px-2
                  py-[3px]
                  text-[7px]
                  font-black
                  uppercase
                  tracking-[0.18em]
                  text-[#A7FF3D]
                "
              >
                AI Energy OS
              </span>

            </div>

            <p className="mt-0.5 text-[9px] font-medium tracking-wide text-white/30">
              Autonomous campus energy orchestration
            </p>

          </div>

        </div>


        <div className="flex items-center gap-2.5">

          <div
            className="
              hidden
              items-center
              gap-3
              rounded-xl
              border
              border-white/[0.07]
              bg-white/[0.035]
              px-3.5
              py-2
              lg:flex
            "
          >

            <StatusDot
              online={
                backendOnline
              }
            />

            <div>

              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/25">
                Network
              </p>

              <p className="text-[10px] font-bold text-white/75">
                {backendOnline
                  ? "System online"
                  : "Offline"}
              </p>

            </div>

          </div>


          <div
            className={`
              flex
              items-center
              rounded-xl
              border
              p-1
              transition-colors
              ${
                isBright
                  ? "border-black/10 bg-black/[0.035]"
                  : "border-white/[0.07] bg-white/[0.035]"
              }
            `}
            role="group"
            aria-label="Theme selector"
          >
            <button
              type="button"
              onClick={() =>
                setTheme("dark")
              }
              aria-pressed={
                theme === "dark"
              }
              title="Dark theme"
              className={`
                inline-flex
                h-8
                items-center
                gap-1.5
                rounded-lg
                px-2.5
                text-[9px]
                font-black
                transition
                ${
                  theme === "dark"
                    ? "bg-[#101510] text-white shadow-sm"
                    : isBright
                    ? "text-black/45 hover:bg-black/[0.045] hover:text-black/75"
                    : "text-white/35 hover:bg-white/[0.05] hover:text-white/70"
                }
              `}
            >
              <Moon size={12} />
              <span className="hidden sm:inline">
                Dark
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setTheme("bright")
              }
              aria-pressed={
                theme === "bright"
              }
              title="Bright theme"
              className={`
                inline-flex
                h-8
                items-center
                gap-1.5
                rounded-lg
                px-2.5
                text-[9px]
                font-black
                transition
                ${
                  theme === "bright"
                    ? "bg-white text-black shadow-sm ring-1 ring-black/5"
                    : "text-white/35 hover:bg-white/[0.05] hover:text-white/70"
                }
              `}
            >
              <Sun size={12} />
              <span className="hidden sm:inline">
                Bright
              </span>
            </button>
          </div>


          <a
            href={`${API_BASE}/docs`}
            target="_blank"
            rel="noreferrer"
            className="
              hidden
              rounded-xl
              border
              border-white/[0.07]
              bg-white/[0.025]
              px-4
              py-2.5
              text-[10px]
              font-bold
              text-white/55
              transition
              hover:border-white/15
              hover:bg-white/[0.05]
              hover:text-white
              md:block
            "
          >
            API Docs
          </a>


          <button
            onClick={
              optimizeEnergy
            }
            disabled={
              loading
            }
            className="
              group
              inline-flex
              h-[42px]
              items-center
              gap-2
              rounded-xl
              bg-[#8CFF00]
              px-5
              text-[11px]
              font-black
              text-[#071000]
              shadow-[0_0_26px_rgba(140,255,0,0.16)]
              transition
              duration-300
              hover:bg-[#A6FF32]
              hover:shadow-[0_0_35px_rgba(140,255,0,0.28)]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >

            {loading ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Play
                size={15}
                fill="currentColor"
              />
            )}

            {loading
              ? "Optimizing"
              : "Optimize"}

          </button>

        </div>

      </header>


      {/* PIPELINE */}

      <div
        className="
          relative
          z-30
          flex
          min-h-[52px]
          items-center
          justify-between
          gap-4
          border-b
          border-white/[0.06]
          bg-white/[0.015]
          px-5
          backdrop-blur-xl
          lg:px-7
        "
      >

        <div className="flex items-center gap-3">

          <span className="hidden text-[8px] font-black uppercase tracking-[0.2em] text-white/20 xl:inline">
            Pipeline
          </span>


          <PipelineItem
            number="01"
            label="Gemini LLM"
            icon={
              BrainCircuit
            }
          />

          <ChevronRight
            size={12}
            className="text-white/15"
          />


          <PipelineItem
            number="02"
            label="Guardrails"
            icon={
              ShieldCheck
            }
          />

          <ChevronRight
            size={12}
            className="text-white/15"
          />


          <PipelineItem
            number="03"
            label="PuLP Solver"
            icon={
              Cpu
            }
          />

          <ChevronRight
            size={12}
            className="text-white/15"
          />


          <PipelineItem
            number="04"
            label="Validation"
            icon={
              CheckCircle2
            }
          />

        </div>


        <div className="hidden items-center gap-5 xl:flex">

          <div>

            <span className="text-[8px] uppercase tracking-wider text-white/20">
              Horizon
            </span>

            <span className="ml-2 text-[9px] font-bold text-white/60">
              24H
            </span>

          </div>


          <div>

            <span className="text-[8px] uppercase tracking-wider text-white/20">
              Demand
            </span>

            <span className="ml-2 text-[9px] font-bold text-white/60">
              {totalDemand} kWh
            </span>

          </div>


          <div>

            <span className="text-[8px] uppercase tracking-wider text-white/20">
              Solar
            </span>

            <span className="ml-2 text-[9px] font-bold text-[#9BFF19]">
              {totalSolar} kWh
            </span>

          </div>

        </div>

      </div>


      {/* MAIN */}

      <main
        className="
          relative
          z-10
          grid
          grid-cols-1
          xl:grid-cols-[300px_minmax(0,1fr)_340px]
          2xl:grid-cols-[320px_minmax(0,1fr)_370px]
        "
      >

        {/* LEFT */}

        <aside
          className={`
            border-r
            border-white/[0.06]
            bg-black/20

            xl:h-[calc(100vh-124px)]
            xl:overflow-y-auto

            ${hiddenScrollbar}
          `}
        >

          <div className="border-b border-white/[0.06] p-5">

            <div className="flex items-center gap-3">

              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#8CFF00]
                  text-black
                  shadow-[0_0_24px_rgba(140,255,0,0.13)]
                "
              >
                <Zap size={16} />
              </div>

              <div>

                <h2 className="text-[13px] font-black">
                  Scenario Control
                </h2>

                <p className="mt-0.5 text-[9px] text-white/25">
                  Define today's operating conditions
                </p>

              </div>

            </div>

          </div>


          <div className="space-y-6 p-5">

            <div>

              <FieldLabel right="24-hour plan">
                Scenario ID
              </FieldLabel>

              <input
                className={
                  inputClass
                }
                value={
                  scenario.scenario_id
                }
                onChange={
                  (
                    event
                  ) =>
                    setScenario(
                      (
                        previous
                      ) => ({
                        ...previous,

                        scenario_id:
                          event.target.value,
                      })
                    )
                }
              />

            </div>


            {/* Notes */}

            <div>

              <div className="mb-3 flex items-center justify-between">

                <div>

                  <div className="text-[10px] font-black uppercase tracking-[0.15em] text-white/45">
                    Operator Notes
                  </div>

                  <p className="mt-1 text-[9px] text-white/20">
                    Natural language directives
                  </p>

                </div>


                {scenario
                  .operator_notes
                  .length < 3 && (
                  <button
                    type="button"
                    onClick={
                      addNote
                    }
                    className="
                      inline-flex
                      items-center
                      gap-1
                      rounded-lg
                      border
                      border-[#8CFF00]/15
                      bg-[#8CFF00]/[0.06]
                      px-2.5
                      py-1.5
                      text-[9px]
                      font-black
                      text-[#9BFF19]
                      transition
                      hover:bg-[#8CFF00]/10
                    "
                  >
                    <Plus size={11} />
                    Add
                  </button>
                )}

              </div>


              <div className="space-y-2.5">

                {scenario
                  .operator_notes
                  .map(
                    (
                      note,
                      index
                    ) => (

                      <div
                        key={
                          index
                        }
                        className="
                          group
                          relative
                          overflow-hidden
                          rounded-2xl
                          border
                          border-white/[0.07]
                          bg-white/[0.025]
                          transition
                          focus-within:border-[#8CFF00]/30
                          focus-within:bg-white/[0.04]
                        "
                      >

                        <div
                          className="
                            absolute
                            left-3
                            top-3
                            flex
                            h-6
                            w-6
                            items-center
                            justify-center
                            rounded-lg
                            bg-[#8CFF00]/10
                            text-[9px]
                            font-black
                            text-[#9BFF19]
                          "
                        >
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </div>


                        <textarea
                          rows={4}
                          value={
                            note
                          }
                          onChange={
                            (
                              event
                            ) =>
                              updateNote(
                                index,
                                event.target.value
                              )
                          }
                          placeholder="Describe an energy constraint..."
                          className="
                            min-h-[110px]
                            w-full
                            resize-none
                            border-0
                            bg-transparent
                            py-3
                            pl-12
                            pr-10
                            text-[11px]
                            font-medium
                            leading-5
                            text-white/70
                            outline-none
                            placeholder:text-white/20
                          "
                        />


                        {scenario
                          .operator_notes
                          .length > 1 && (
                          <button
                            type="button"
                            onClick={
                              () =>
                                removeNote(
                                  index
                                )
                            }
                            className="
                              absolute
                              right-3
                              top-3
                              text-white/20
                              transition
                              hover:text-red-400
                            "
                          >
                            <Trash2 size={13} />
                          </button>
                        )}

                      </div>

                    )
                  )}

              </div>

            </div>


            {/* Battery */}

            <div>

              <div className="mb-3 flex items-center gap-2.5">

                <div
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-[#8CFF00]/15
                    bg-[#8CFF00]/[0.06]
                    text-[#9BFF19]
                  "
                >
                  <BatteryCharging size={14} />
                </div>

                <div>

                  <h3 className="text-[10px] font-black uppercase tracking-[0.12em] text-white/55">
                    Battery System
                  </h3>

                  <p className="mt-0.5 text-[8px] text-white/20">
                    Energy storage constraints
                  </p>

                </div>

              </div>


              <div className="grid grid-cols-2 gap-2">

                <BatteryField
                  label="Capacity"
                  value={
                    scenario
                      .battery
                      .capacity_kwh
                  }
                  onChange={
                    (
                      event
                    ) =>
                      updateBattery(
                        "capacity_kwh",
                        event.target.value
                      )
                  }
                />


                <BatteryField
                  label="Initial"
                  value={
                    scenario
                      .battery
                      .initial_energy_kwh
                  }
                  onChange={
                    (
                      event
                    ) =>
                      updateBattery(
                        "initial_energy_kwh",
                        event.target.value
                      )
                  }
                />


                <BatteryField
                  label="Reserve"
                  value={
                    scenario
                      .battery
                      .minimum_energy_kwh
                  }
                  onChange={
                    (
                      event
                    ) =>
                      updateBattery(
                        "minimum_energy_kwh",
                        event.target.value
                      )
                  }
                />


                <BatteryField
                  label="Max Charge"
                  value={
                    scenario
                      .battery
                      .max_charge_kwh_per_hour
                  }
                  onChange={
                    (
                      event
                    ) =>
                      updateBattery(
                        "max_charge_kwh_per_hour",
                        event.target.value
                      )
                  }
                />


                <BatteryField
                  wide
                  label="Max Discharge"
                  value={
                    scenario
                      .battery
                      .max_discharge_kwh_per_hour
                  }
                  onChange={
                    (
                      event
                    ) =>
                      updateBattery(
                        "max_discharge_kwh_per_hour",
                        event.target.value
                      )
                  }
                />

              </div>

            </div>


            <button
              onClick={
                optimizeEnergy
              }
              disabled={
                loading
              }
              className="
                group
                flex
                w-full
                items-center
                justify-between
                rounded-2xl
                bg-[#8CFF00]
                px-4
                py-3.5
                text-[11px]
                font-black
                text-black
                shadow-[0_0_30px_rgba(140,255,0,0.11)]
                transition
                duration-300
                hover:bg-[#A4FF2B]
                hover:shadow-[0_0_35px_rgba(140,255,0,0.2)]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              <div className="flex items-center gap-2">

                {loading ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <Sparkles size={15} />
                )}

                {loading
                  ? "Computing optimal plan..."
                  : "Run AI Optimization"}

              </div>

              {!loading && (
                <ChevronRight
                  size={15}
                  className="transition group-hover:translate-x-0.5"
                />
              )}

            </button>


            <button
              onClick={
                resetDemo
              }
              className="
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-white/[0.07]
                bg-white/[0.02]
                py-2.5
                text-[10px]
                font-bold
                text-white/35
                transition
                hover:border-white/15
                hover:bg-white/[0.04]
                hover:text-white/60
              "
            >
              <RefreshCcw size={12} />
              Reset Scenario
            </button>


            {error && (
              <div
                className="
                  rounded-2xl
                  border
                  border-red-500/20
                  bg-red-500/[0.07]
                  p-3
                  text-[10px]
                  leading-5
                  text-red-300
                "
              >
                {error}
              </div>
            )}

          </div>

        </aside>


        {/* CENTER */}

        <section
          className={`
            min-w-0
            p-5

            xl:h-[calc(100vh-124px)]
            xl:overflow-y-auto

            lg:p-6

            ${premiumScrollbar}
          `}
        >

          <div className="mb-5 flex items-end justify-between">

            <div>

              <div className="mb-1.5 flex items-center gap-2">

                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#8CFF00]">
                  Operations Console
                </span>

                {result && (
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1
                      rounded-full
                      border
                      border-[#8CFF00]/15
                      bg-[#8CFF00]/[0.07]
                      px-2
                      py-1
                      text-[7px]
                      font-black
                      uppercase
                      tracking-widest
                      text-[#A5FF36]
                    "
                  >
                    <Check size={9} />
                    Valid plan
                  </span>
                )}

              </div>


              <h2 className="text-[25px] font-black tracking-[-0.04em] text-white">
                24-Hour Energy Dispatch
              </h2>

              <p className="mt-1 text-[10px] text-white/25">
                AI-assisted demand, solar, storage and grid coordination.
              </p>

            </div>


            <div
              className="
                hidden
                items-center
                gap-2
                rounded-xl
                border
                border-white/[0.07]
                bg-white/[0.025]
                px-3
                py-2
                md:flex
              "
            >
              <Clock3
                size={12}
                className="text-[#8CFF00]"
              />

              <span className="text-[9px] font-bold text-white/40">
                00:00 — 23:00
              </span>
            </div>

          </div>


          {/* KPI */}

          <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">

            <StatCard
              title="Total Energy Cost"
              caption="Optimized daily spend"
              value={
                result
                  ? `৳${Number(
                      result.total_cost_bdt
                    ).toLocaleString()}`
                  : "—"
              }
              icon={
                CircleDollarSign
              }
            />


            <StatCard
              title="Grid Consumption"
              caption="Total utility import"
              value={
                result
                  ? Number(
                      result.total_grid_kwh
                    ).toFixed(1)
                  : "—"
              }
              unit="kWh"
              icon={
                Activity
              }
            />


            <StatCard
              title="Peak Grid Draw"
              caption="Maximum hourly draw"
              value={
                result
                  ? Number(
                      result.peak_grid_kwh
                    ).toFixed(1)
                  : "—"
              }
              unit="kWh"
              icon={
                Gauge
              }
            />

          </div>


          {/* Chart */}

          <div
            className="
              mb-5
              overflow-hidden
              rounded-[24px]
              border
              border-white/[0.07]
              bg-white/[0.025]
              backdrop-blur-xl
            "
          >

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4">

              <div>

                <div className="flex items-center gap-2">

                  <h3 className="text-[12px] font-black text-white">
                    Energy Flow
                  </h3>

                  <span
                    className="
                      rounded-md
                      bg-white/[0.05]
                      px-2
                      py-1
                      text-[7px]
                      font-black
                      uppercase
                      tracking-widest
                      text-white/25
                    "
                  >
                    kWh
                  </span>

                </div>

                <p className="mt-1 text-[9px] text-white/20">
                  Hourly optimized operating profile
                </p>

              </div>


              <div className="flex flex-wrap gap-3">

                {[
                  ["#CBD5E1", "Demand"],
                  ["#FACC15", "Solar"],
                  ["#8CFF00", "Grid"],
                  ["#22D3EE", "Battery"],
                ].map(
                  (
                    [
                      color,
                      label,
                    ]
                  ) => (
                    <div
                      key={
                        label
                      }
                      className="flex items-center gap-1.5"
                    >

                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background:
                            color,
                        }}
                      />

                      <span className="text-[8px] font-bold text-white/30">
                        {label}
                      </span>

                    </div>
                  )
                )}

              </div>

            </div>


            <div className="h-[360px] px-3 pb-3 pt-4">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <AreaChart
                  data={
                    chartData
                  }
                  margin={{
                    top: 5,
                    right: 15,
                    left: 0,
                    bottom: 0,
                  }}
                >

                  <defs>

                    <linearGradient
                      id="gridGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#8CFF00"
                        stopOpacity={0.22}
                      />

                      <stop
                        offset="100%"
                        stopColor="#8CFF00"
                        stopOpacity={0}
                      />
                    </linearGradient>

                  </defs>


                  <CartesianGrid
                    stroke={
                      isBright
                        ? "rgba(15,23,18,0.10)"
                        : "rgba(255,255,255,0.055)"
                    }
                    strokeDasharray="4 7"
                    vertical={false}
                  />


                  <XAxis
                    dataKey="hour"
                    axisLine={false}
                    tickLine={false}
                    interval={2}
                    tick={{
                      fill: isBright
                        ? "rgba(15,23,18,.48)"
                        : "rgba(255,255,255,.25)",
                      fontSize: 9,
                    }}
                    dy={8}
                  />


                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={35}
                    tick={{
                      fill: isBright
                        ? "rgba(15,23,18,.48)"
                        : "rgba(255,255,255,.25)",
                      fontSize: 9,
                    }}
                  />


                  <Tooltip
                    content={
                      <ChartTooltip
                        bright={
                          isBright
                        }
                      />
                    }
                  />


                  <Area
                    type="monotone"
                    dataKey="grid"
                    name="Grid"
                    stroke="#8CFF00"
                    strokeWidth={2.6}
                    fill="url(#gridGradient)"
                    dot={false}
                    connectNulls={false}
                  />


                  <Line
                    type="monotone"
                    dataKey="demand"
                    name="Demand"
                    stroke={
                      isBright
                        ? "#5F6F63"
                        : "#CBD5E1"
                    }
                    strokeWidth={1.8}
                    dot={false}
                  />


                  <Line
                    type="monotone"
                    dataKey="solar"
                    name="Solar"
                    stroke="#FACC15"
                    strokeWidth={1.8}
                    dot={false}
                  />


                  <Line
                    type="monotone"
                    dataKey="battery"
                    name="Battery Energy"
                    stroke="#22D3EE"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                  />

                </AreaChart>

              </ResponsiveContainer>

            </div>

          </div>


          {/* Schedule */}

          <div
            className="
              overflow-hidden
              rounded-[24px]
              border
              border-white/[0.07]
              bg-white/[0.025]
            "
          >

            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">

              <div>

                <h3 className="text-[12px] font-black text-white">
                  Optimized Dispatch Schedule
                </h3>

                <p className="mt-1 text-[9px] text-white/20">
                  Machine-validated hourly actions
                </p>

              </div>


              <div className="flex items-center gap-2">

                <span
                  className="
                    rounded-lg
                    border
                    border-white/[0.07]
                    bg-white/[0.03]
                    px-2.5
                    py-1.5
                    text-[8px]
                    font-bold
                    text-white/30
                  "
                >
                  24 HOURS
                </span>

                {result && (
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1
                      rounded-lg
                      border
                      border-[#8CFF00]/15
                      bg-[#8CFF00]/[0.06]
                      px-2.5
                      py-1.5
                      text-[8px]
                      font-black
                      text-[#9BFF19]
                    "
                  >
                    <ShieldCheck size={10} />
                    VALIDATED
                  </span>
                )}

              </div>

            </div>


            <div
              className={`
                max-h-[330px]
                overflow-auto

                ${premiumScrollbar}
              `}
            >

              <table className="w-full border-collapse">

                <thead
                  className={`sticky top-0 z-10 ${
                    isBright
                      ? "bg-[#F7FAF6]"
                      : "bg-[#080C09]"
                  }`}
                >

                  <tr>

                    {[
                      "TIME",
                      "GRID",
                      "SOLAR",
                      "BATTERY ACTION",
                      "FLOW",
                      "ENERGY AFTER",
                    ].map(
                      (
                        heading
                      ) => (
                        <th
                          key={
                            heading
                          }
                          className="
                            border-b
                            border-white/[0.05]
                            px-4
                            py-3
                            text-left
                            text-[8px]
                            font-black
                            tracking-[0.13em]
                            text-white/25
                          "
                        >
                          {heading}
                        </th>
                      )
                    )}

                  </tr>

                </thead>


                <tbody>

                  {result
                    ?.hourly_plan
                    ?.length ? (

                    result.hourly_plan.map(
                      (
                        row
                      ) => (
                        <tr
                          key={
                            row.hour
                          }
                          className="
                            border-b
                            border-white/[0.035]
                            transition
                            hover:bg-white/[0.025]
                          "
                        >

                          <td className="px-4 py-3">

                            <div className="flex items-center gap-2">

                              <span
                                className="
                                  h-1.5
                                  w-1.5
                                  rounded-full
                                  bg-[#8CFF00]
                                  shadow-[0_0_8px_rgba(140,255,0,0.55)]
                                "
                              />

                              <span className="text-[10px] font-black text-white/75">
                                {String(
                                  row.hour
                                ).padStart(
                                  2,
                                  "0"
                                )}
                                :00
                              </span>

                            </div>

                          </td>


                          <td className="px-4 py-3 text-[10px] font-bold text-white/55">
                            {Number(
                              row.grid_kwh
                            ).toFixed(1)}

                            <span className="ml-1 text-[7px] text-white/20">
                              kWh
                            </span>
                          </td>


                          <td className="px-4 py-3 text-[10px] font-bold text-white/55">
                            {Number(
                              row.solar_used_kwh
                            ).toFixed(1)}

                            <span className="ml-1 text-[7px] text-white/20">
                              kWh
                            </span>
                          </td>


                          <td className="px-4 py-3">

                            <span
                              className={`
                                inline-flex
                                rounded-full
                                border
                                px-2.5
                                py-1
                                text-[8px]
                                font-black
                                uppercase
                                tracking-wider

                                ${
                                  row.battery_action ===
                                  "charge"
                                    ? "border-[#8CFF00]/20 bg-[#8CFF00]/10 text-[#9BFF19]"
                                    : row.battery_action ===
                                      "discharge"
                                    ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                                    : "border-white/[0.07] bg-white/[0.03] text-white/25"
                                }
                              `}
                            >
                              {row.battery_action}
                            </span>

                          </td>


                          <td className="px-4 py-3 text-[10px] font-bold text-white/55">
                            {Number(
                              row.battery_kwh
                            ).toFixed(1)}

                            <span className="ml-1 text-[7px] text-white/20">
                              kWh
                            </span>
                          </td>


                          <td className="px-4 py-3">

                            <div className="flex items-center gap-2">

                              <BatteryCharging
                                size={12}
                                className="text-[#8CFF00]"
                              />

                              <span className="text-[10px] font-black text-white/70">
                                {Number(
                                  row.battery_energy_after_kwh
                                ).toFixed(0)}
                              </span>

                              <span className="text-[7px] text-white/20">
                                kWh
                              </span>

                            </div>

                          </td>

                        </tr>
                      )
                    )

                  ) : (

                    <tr>

                      <td
                        colSpan={6}
                        className="py-16"
                      >

                        <div className="flex flex-col items-center justify-center">

                          <div
                            className="
                              mb-3
                              flex
                              h-12
                              w-12
                              items-center
                              justify-center
                              rounded-2xl
                              border
                              border-white/[0.07]
                              bg-white/[0.03]
                              text-white/20
                            "
                          >
                            <Activity size={20} />
                          </div>

                          <p className="text-[11px] font-black text-white/45">
                            No dispatch plan generated
                          </p>

                          <p className="mt-1 text-[9px] text-white/20">
                            Run the optimizer to generate the 24-hour schedule.
                          </p>

                        </div>

                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </section>


        {/* RIGHT */}

        <aside
          className={`
            border-l
            border-white/[0.06]
            bg-black/20

            xl:h-[calc(100vh-124px)]
            xl:overflow-y-auto

            ${hiddenScrollbar}
          `}
        >

          <div className="border-b border-white/[0.06] p-5">

            <div className="flex items-center gap-3">

              <div
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-[#8CFF00]/15
                  bg-[#8CFF00]/[0.07]
                  text-[#9BFF19]
                "
              >
                <BrainCircuit size={16} />
              </div>

              <div>

                <div className="flex items-center gap-2">

                  <h2 className="text-[13px] font-black">
                    AI Interpretation
                  </h2>

                  <span
                    className="
                      rounded-full
                      border
                      border-[#8CFF00]/15
                      bg-[#8CFF00]/[0.06]
                      px-2
                      py-[3px]
                      text-[7px]
                      font-black
                      uppercase
                      tracking-widest
                      text-[#9BFF19]
                    "
                  >
                    Gemini
                  </span>

                </div>

                <p className="mt-0.5 text-[9px] text-white/25">
                  Machine-checkable operator directives
                </p>

              </div>

            </div>

          </div>


          <div className="space-y-4 p-5">

            {!result && (
              <div
                className="
                  flex
                  min-h-[280px]
                  flex-col
                  items-center
                  justify-center
                  rounded-[24px]
                  border
                  border-dashed
                  border-white/[0.08]
                  bg-white/[0.018]
                  p-5
                  text-center
                "
              >

                <div
                  className="
                    relative
                    mb-5
                    flex
                    h-[82px]
                    w-[62px]
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-[28px]
                    border
                    border-white/15
                    bg-black
                    shadow-[inset_0_2px_5px_rgba(255,255,255,0.08),0_0_35px_rgba(140,255,0,0.1)]
                  "
                >

                  <div
                    className="
                      absolute
                      bottom-0
                      h-[47%]
                      w-full
                      bg-gradient-to-t
                      from-[#00C900]
                      via-[#63FF00]
                      to-[#B4FF29]
                    "
                  />

                  <Zap
                    size={27}
                    className="theme-keep-white relative z-10 text-white drop-shadow-[0_3px_5px_rgba(0,0,0,0.8)]"
                    fill="rgba(255,255,255,.16)"
                  />

                </div>


                <p className="text-[12px] font-black text-white/60">
                  Awaiting operator input
                </p>

                <p className="mt-2 max-w-[250px] text-[10px] leading-5 text-white/20">
                  CampusGrid will translate natural-language instructions into validated energy constraints.
                </p>


                <div
                  className="
                    mt-5
                    w-full
                    rounded-2xl
                    border
                    border-white/[0.06]
                    bg-black/30
                    p-3
                    text-left
                  "
                >

                  <div className="mb-2 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-[#8CFF00]">
                    <Sparkles size={10} />
                    Example
                  </div>

                  <p className="text-[9px] leading-4 text-white/30">
                    “Reduce solar output by 80% from 1 PM until 3 PM.”
                  </p>

                  <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-[#9BFF19]">
                    <ChevronRight size={10} />
                    solar_reduction
                  </div>

                </div>

              </div>
            )}


            {result
              ?.directive_interpretation
              ?.map(
                (
                  directive
                ) => (
                  <DirectiveCard
                    key={
                      directive.note_index
                    }
                    directive={
                      directive
                    }
                  />
                )
              )}


            {result && (
              <>

                <div className="h-px bg-white/[0.06]" />


                <div
                  className="
                    rounded-[22px]
                    border
                    border-white/[0.07]
                    bg-white/[0.025]
                    p-4
                  "
                >

                  <div className="mb-3 flex items-center gap-2">

                    <div
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-xl
                        bg-[#8CFF00]/10
                        text-[#9BFF19]
                      "
                    >
                      <Server size={14} />
                    </div>


                    <div>

                      <h3 className="text-[10px] font-black uppercase tracking-wider text-white/65">
                        Plan Summary
                      </h3>

                      <p className="text-[8px] text-white/20">
                        Optimizer execution
                      </p>

                    </div>

                  </div>


                  <p className="text-[10px] leading-5 text-white/35">
                    {result.plan_summary}
                  </p>

                </div>


                <div
                  className="
                    relative
                    overflow-hidden
                    rounded-[22px]
                    border
                    border-[#8CFF00]/15
                    bg-[#8CFF00]/[0.055]
                    p-4
                  "
                >

                  <div
                    className="
                      pointer-events-none
                      absolute
                      -right-10
                      -top-10
                      h-28
                      w-28
                      rounded-full
                      bg-[#8CFF00]/10
                      blur-3xl
                    "
                  />


                  <div className="relative z-10">

                    <div className="mb-4 flex items-center justify-between">

                      <div className="flex items-center gap-2">

                        <ShieldCheck
                          size={16}
                          className="text-[#9BFF19]"
                        />

                        <span className="text-[10px] font-black text-white">
                          Plan Validated
                        </span>

                      </div>

                      <span
                        className="
                          rounded-full
                          bg-[#8CFF00]
                          px-2.5
                          py-1
                          text-[7px]
                          font-black
                          uppercase
                          tracking-widest
                          text-black
                        "
                      >
                        Passed
                      </span>

                    </div>


                    <div className="grid grid-cols-2 gap-2">

                      {[
                        "Directives",
                        "Energy Balance",
                        "Battery Limits",
                        "Day Neutrality",
                      ].map(
                        (
                          item
                        ) => (
                          <div
                            key={
                              item
                            }
                            className="
                              flex
                              items-center
                              gap-1.5
                              rounded-lg
                              bg-black/20
                              px-2
                              py-2
                              text-[8px]
                              font-bold
                              text-white/40
                            "
                          >
                            <Check
                              size={9}
                              className="text-[#8CFF00]"
                            />

                            {item}
                          </div>
                        )
                      )}

                    </div>

                  </div>

                </div>


                <div
                  className="
                    rounded-[22px]
                    border
                    border-white/[0.07]
                    bg-white/[0.02]
                    p-4
                  "
                >

                  <p className="mb-3 text-[8px] font-black uppercase tracking-[0.2em] text-white/20">
                    Optimization Engine
                  </p>


                  <div className="grid grid-cols-2 gap-2">

                    {[
                      [
                        BrainCircuit,
                        "Gemini",
                        "LLM",
                      ],
                      [
                        ShieldCheck,
                        "Guardrails",
                        "Rules",
                      ],
                      [
                        Cpu,
                        "PuLP",
                        "Solver",
                      ],
                      [
                        CheckCircle2,
                        "Validator",
                        "Safety",
                      ],
                    ].map(
                      (
                        [
                          Icon,
                          name,
                          type,
                        ]
                      ) => (
                        <div
                          key={
                            name
                          }
                          className="
                            rounded-xl
                            border
                            border-white/[0.06]
                            bg-black/20
                            p-3
                          "
                        >

                          <Icon
                            size={13}
                            className="mb-2 text-[#8CFF00]"
                          />

                          <p className="text-[9px] font-black text-white/55">
                            {name}
                          </p>

                          <p className="mt-0.5 text-[7px] uppercase tracking-wider text-white/15">
                            {type}
                          </p>

                        </div>
                      )
                    )}

                  </div>

                </div>

              </>
            )}

          </div>

        </aside>

      </main>

    </div>
  );
}