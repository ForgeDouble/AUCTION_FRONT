import { useParams } from "react-router-dom";

/* useparam이 string으로 올 시 number로 변환해주는 훅 */
export const useNumberParam = (paramName: string): number | null => {
  const params = useParams();
  const param = params[paramName];

  if (!param) return null;

  const num = parseInt(param, 10);
  return isNaN(num) ? null : num;
};
