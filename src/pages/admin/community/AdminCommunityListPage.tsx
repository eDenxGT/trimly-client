import { AnimatePresence, motion } from "framer-motion";
import { CommunitiesTable } from "@/components/admin/community/CommunitiesTable";
import {
  useCommunityStatusToggle,
  useDeleteCommunity,
  useGetAllCommunities,
} from "@/hooks/admin/useCommunity";
import { Pagination1 } from "@/components/common/paginations/Pagination1";
import { useEffect, useState } from "react";
import { useToaster } from "@/hooks/ui/useToaster";
import { adminGetAllCommunities } from "@/services/admin/adminService";
import { debounce } from "lodash";

const ITEMS_PER_PAGE = 2;

export const AdminCommunityListPage = () => {
  const [page, setPage] = useState(1);
  const { successToast, errorToast } = useToaster();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  useEffect(() => {
    const handler = debounce(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    handler();

    return () => {
      handler.cancel();
    };
  }, [searchTerm]);

  const { data, refetch: refetchAllCommunities } = useGetAllCommunities({
    queryFn: adminGetAllCommunities,
    search: debouncedSearch,
    page,
    limit: ITEMS_PER_PAGE,
  });

  const { mutate: toggleStatus } = useCommunityStatusToggle();

  const { mutate: deleteCommunity } = useDeleteCommunity();

  const handleDelete = (communityId: string) => {
    deleteCommunity(
      { communityId },
      {
        onSuccess: (data) => {
          successToast(data.message);
          refetchAllCommunities();
        },
        onError: (error: any) => {
          errorToast(error.response.data.message);
        },
      }
    );
  };

  const handleStatusChange = (communityId: string) => {
    toggleStatus(
      { communityId },
      {
        onSuccess: (data) => {
          successToast(data.message);
          refetchAllCommunities();
        },
        onError: (error: any) => {
          errorToast(error.response.data.message);
        },
      }
    );
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = data?.totalPages || 1;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={"admin-community-list"}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        <CommunitiesTable
          communities={data?.communities || []}
          onDelete={handleDelete}
          handlePageChange={handlePageChange}
          onStatusChange={handleStatusChange}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        {/* Pagination component */}
        {totalPages > 1 && (
          <div className="mt-6 mb-8">
            <Pagination1
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
