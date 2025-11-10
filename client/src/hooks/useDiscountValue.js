import { useMemo } from "react";
import { useGetDiscountConfigQuery } from "../features/reservation/reservationApiSlice";

const DEFAULT_DISCOUNT_VALUE = Number(process.env.REACT_APP_DEFAULT_DISCOUNT) || 4000;

export const useDiscountValue = () => {
  const queryResult = useGetDiscountConfigQuery();
  const discountValue = useMemo(() => {
    const fetchedValue = Number(queryResult.data?.value);
    if (Number.isFinite(fetchedValue) && fetchedValue >= 0) {
      return fetchedValue;
    }
    return DEFAULT_DISCOUNT_VALUE;
  }, [queryResult.data]);

  return {
    ...queryResult,
    discountValue,
  };
};

export default useDiscountValue;
