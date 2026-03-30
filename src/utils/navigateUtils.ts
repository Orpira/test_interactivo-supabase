import { useNavigate } from "react-router-dom";

export function useHandleGo() {
  const navigate = useNavigate();

  return (cat: string, id: string) => {
    navigate(`/editor/${cat.toLowerCase()}/${cat.toLowerCase()}-${id}`);
  };
}
