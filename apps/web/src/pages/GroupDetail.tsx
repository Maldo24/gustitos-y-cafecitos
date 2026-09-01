import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import { getGroupBySlug, getGroupMembers, addMember } from "../api/groups";
import type { Group, User } from "../types";

function GroupDetail() {
  const { slug } = useParams<{ slug: string }>();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [friendUsername, setFriendUsername] = useState("");
  const [adding, setAdding] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;

    getGroupBySlug(slug)
      .then((data) => {
        setGroup(data);
        return getGroupMembers(data._id);
      })
      .then(setMembers)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar el grupo.");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError("");
    if (adding || !group || friendUsername.trim() === "") return;
    setAdding(true);

    try {
      await addMember(group._id, friendUsername.trim());
      setFriendUsername("");
      const updatedMembers = await getGroupMembers(group._id);
      setMembers(updatedMembers);
    } catch (err: unknown) {
      setMemberError(err instanceof Error ? err.message : "Error al agregar al amigo.");
    } finally {
      setAdding(false);
    }
  };

  const handleCopyLink = async () => {
    if (!group) return;
    const link = `${window.location.origin}/grupo/${group.slug}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMemberError("No se pudo copiar el link.");
    }
  };

  if (loading) {
    return <div className="p-6 max-w-4xl mx-auto h-full">Cargando grupo...</div>;
  }

  if (error || !group) {
    return (
      <div className="p-6 max-w-4xl mx-auto h-full">
        <p className="text-red-500 text-sm">{error || "El grupo no fue encontrado."}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto h-full flex flex-col overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-4xl font-bold text-butter-500 mb-1">{group.name}</h2>
          <p className="text-gray-500 text-sm">Código: <span className="font-mono">{group.slug}</span></p>
        </div>
        <Button onClick={handleCopyLink}>
          {copied ? "¡Link copiado!" : "Copiar link de invitación"}
        </Button>
      </div>

      <div className="mt-4">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Miembros</h3>
        {members.length === 0 ? (
          <p className="text-gray-500">Todavía no hay miembros.</p>
        ) : (
          <ul className="flex flex-col gap-2 mb-6">
            {members.map((member) => (
              <li
                key={member._id}
                className="bg-white p-3 rounded-xl shadow-sm border border-butter-200 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-gray-800">
                    {member.names} {member.firtsSurname}{" "}
                    <span className="text-gray-400 font-normal">@{member.username}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {memberError && <p className="text-red-500 text-sm mb-4">{memberError}</p>}

        <form onSubmit={handleAddFriend} className="flex flex-col gap-4 max-w-sm">
          <Input
            type="text"
            label="Agregar amigo por usuario"
            placeholder="juanito123"
            value={friendUsername}
            onChange={(value) => setFriendUsername(value)}
          />
          <Button type="submit" disabled={adding}>
            {adding ? "Agregando..." : "Agregar amigo"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default GroupDetail;