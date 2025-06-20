import BarberOpeningHoursForm, {
  BusinessHours,
} from "@/components/barber/settings/BarberOpeningHoursManagement";
import { useBarberProfileMutation } from "@/hooks/barber/useBarberProfile";
import { useToaster } from "@/hooks/ui/useToaster";
import { barberLogin } from "@/store/slices/barber.slice";
import { RootState, useAppDispatch } from "@/store/store";
import { IBarber } from "@/types/User";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";


export const BarberOpeningHoursPage = () => {
  const barber = useSelector((state: RootState) => state.barber.barber);
  const {
    mutate: updateBarber,
    isPending,
    isError,
  } = useBarberProfileMutation();
  const { successToast, errorToast } = useToaster();
  const dispatch = useAppDispatch();


  function validateWorkingHours(workingHours: IBarber["openingHours"]): boolean {
    if (!workingHours) {
      errorToast("Working hours are required");
      return false;
    }
    for (const [day, timing] of Object.entries(workingHours)) {
      console.log(day, timing);
      const { open, close } = timing as { open: string; close: string };
      console.log(open, close);
      if (open !== null && open === "" || close !== null && close === "") {
        errorToast(`Please set both open and close time or mark ${day} as off`);
        return false;
      }
    }
    return true;
  }

  const updateOpeningHours = (barberOpeningHours: IBarber["openingHours"]) => {
    if (!validateWorkingHours(barberOpeningHours)) return;
    updateBarber(
      {
        openingHours: barberOpeningHours,
      },
      {
        onSuccess: (data) => {
          successToast(data.message);
          dispatch(barberLogin(data.user));
        },
        onError: (error: any) => {
          errorToast(error.response.data.message);
        },
      }
    );
  };

  const sanitizedHours: BusinessHours = Object.fromEntries(
    Object.entries(barber?.openingHours ?? {}).map(([day, hours]) => [
      day,
      {
        open: hours?.open ?? null,
        close: hours?.close ?? null,
      },
    ])
  );

  return (
    <motion.div
      key={"barber-profile-edit"}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="p-4"
    >
      <BarberOpeningHoursForm
        initialHours={sanitizedHours}
        onSave={(hours) => updateOpeningHours(hours)}
        isLoading={isPending && !isError}
      />
    </motion.div>
  );
};


