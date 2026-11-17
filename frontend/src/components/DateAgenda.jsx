import React, { useState, forwardRef } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { fr } from "date-fns/locale";
import { format } from "date-fns";
import "cally";
import { Calendar, ChevronDown, X } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("fr", fr);

const CustomInput = forwardRef(
  ({ value, onClick, placeholder, onClear, selectedDate }, ref) => {
    const handleClear = (e) => {
      e.stopPropagation();
      e.preventDefault();
      onClear();
    };

    // On s'assure d'avoir une string lisible
    const displayValue =
      value ||
      (selectedDate
        ? format(selectedDate, "dd MMMM yyyy", { locale: fr })
        : "");

    return (
      <button
        type="button"
        onClick={onClick}
        ref={ref}
        className={`group flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left text-[15px] transition
          ${
            displayValue
              ? "border-indigo-500 bg-white font-medium text-gray-900"
              : "border-gray-300 bg-white text-gray-500"
          }
          hover:border-indigo-500 hover:ring-4 hover:ring-indigo-100
          focus:outline-none focus:ring-4 focus:ring-indigo-200`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <Calendar className="h-5 w-5 shrink-0 text-indigo-500" />
          <span className="truncate">
            {displayValue || placeholder || "Ex: JJ/MMM/AAAA..."}
          </span>
        </span>

        <span className="ml-2 flex shrink-0 items-center gap-2 border-l border-gray-200 pl-3">
          {displayValue && (
            <span
              onClick={handleClear}
              role="button"
              tabIndex={0}
              className="flex h-5 w-5 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-red-500"
              title="Effacer"
            >
              <X className="h-4 w-4" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-gray-400 transition group-hover:text-indigo-500" />
        </span>
      </button>
    );
  }
);

export function DateAgenda({
  label = "Date de soutenance",
  value,
  onChange,
  placeholder = "Choisir une date",
  minDate = new Date(),
}) {
  const [open, setOpen] = useState(false);

  const handleChange = (date) => {
    onChange(date);
    setOpen(false);
  };

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-gray-800">{label}</label>
      )}

      <DatePicker
        selected={value}
        onChange={handleChange}
        open={open}
        onInputClick={() => setOpen(true)}
        onClickOutside={() => setOpen(false)}
        onCalendarClose={() => setOpen(false)}
        customInput={
          <CustomInput
            placeholder={placeholder}
            selectedDate={value} /* 👈 on passe la date brute */
            onClear={() => {
              onChange(null);
              setOpen(false);
            }}
          />
        }
        locale="fr"
        dateFormat="dd MMMM yyyy"
        minDate={minDate}
        showPopperArrow={false}
        popperPlacement="bottom-start"
        calendarStartDay={1}
        shouldCloseOnSelect={true}
      />
    </div>
  );
}

// export const DatyCally = () => {
//   return (
//     <div>
//       <button
//         popoverTarget="cally-popover1"
//         className="input"
//         id="cally1"
//         style="anchor-name:--cally1"
//       >
//         Ex: JJ/MM/AAAA...
//       </button>
//       <div
//         popover="auto"
//         id="cally-popover1"
//         className="dropdown bg-base-100 rounded-box shadow-lg"
//         style="position-anchor:--cally1"
//       >
//         <calendar-date
//           className="cally"
//           onchange="document.getElementById('cally1').innerText = this.value"
//         >
//           <svg
//             aria-label="Previous"
//             className="fill-current size-4"
//             slot="previous"
//             xmlns="http://www.w3.org/2000/svg"
//             viewBox="0 0 24 24"
//           >
//             <path d="M15.75 19.5 8.25 12l7.5-7.5"></path>
//           </svg>
//           <svg
//             aria-label="Next"
//             className="fill-current size-4"
//             slot="next"
//             xmlns="http://www.w3.org/2000/svg"
//             viewBox="0 0 24 24"
//           >
//             <path d="m8.25 4.5 7.5 7.5-7.5 7.5"></path>
//           </svg>
//           <calendar-month></calendar-month>
//         </calendar-date>
//       </div>
//     </div>
//   );
// };
