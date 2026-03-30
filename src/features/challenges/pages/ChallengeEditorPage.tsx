import { useParams } from "react-router-dom";
import Editor from "@/features/editor/Editor";
import { useEffect, useState } from "react";
import { useChallengeStore } from "@/store/challengeStore";

export default function ChallengeEditorPage() {
  const { id } = useParams();
  const { challenges, loading, fetchChallenges, getChallengeById } =
    useChallengeStore();
  const [challenge, setChallenge] = useState<any>(null);

  useEffect(() => {
    if (challenges.length === 0 && !loading) {
      fetchChallenges();
    }
  }, [challenges.length, loading, fetchChallenges]);

  useEffect(() => {
    if (id && challenges.length > 0) {
      setChallenge(getChallengeById(id));
    }
  }, [id, challenges, getChallengeById]);

  if (loading) return <p className="p-6 text-center">Cargando reto...</p>;
  if (!challenge) return <p className="p-6 text-center">Reto no encontrado.</p>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{challenge.title}</h1>
      <pre className="mb-4 text-gray-700">{challenge.instructions}</pre>
      <Editor
        starterCode={challenge.initialCode || ""}
        categoryFromChallenge={challenge.category}
        expectedOutput={challenge.expectedOutput}
      />
    </div>
  );
}
