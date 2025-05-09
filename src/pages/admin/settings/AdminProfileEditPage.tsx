import { motion } from "framer-motion";
import ProfileEditForm from "@/components/common/forms/ProfileEditForm";
import { useSelector } from "react-redux";
import { useToaster } from "@/hooks/ui/useToaster";
import { RootState, useAppDispatch } from "@/store/store";
import { adminLogin } from "@/store/slices/admin.slice";
import { IAdmin, IBarber, IClient } from "@/types/User";
import { useAdminProfileMutation } from "@/hooks/admin/useAdminProfile";
import useRefreshSession from "@/hooks/common/useRefreshSession";

export const AdminProfileEditPage = () => {
  useRefreshSession("admin");
  const admin = useSelector((state: RootState) => state.admin.admin);
  const {
    mutate: updateProfile,
    isPending,
    isError,
  } = useAdminProfileMutation();
  const { successToast, errorToast } = useToaster();

  const dispatch = useAppDispatch();

  const handleAdminProfileUpdate = (data: IAdmin | IBarber | IClient) => {
    if (isAdmin(data)) {
      updateProfile(
        {
          ...data,
        },
        {
          onSuccess: (data) => {
            successToast(data.message);
            dispatch(adminLogin(data.user as IAdmin));
          },
          onError: (error: any) => {
            errorToast(error.response.data.message);
          },
        }
      );
    }
  };

  function isAdmin(user: IAdmin | IBarber | IClient): user is IAdmin {
    return (user as IAdmin).fullName !== undefined;
  }

  return (
    <motion.div
      key={"admin-profile-edit"}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="p-4 mt-16"
    >
      <ProfileEditForm
        isLoading={!isError && isPending}
        role="admin"
        initialData={admin as IAdmin}
        onSubmit={handleAdminProfileUpdate}
      />
    </motion.div>
  );
};
