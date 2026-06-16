import { useAuth } from "../../services/auth";
import { useState } from "react";
import UserProfileModal from "./UserProfileModal";

export default function UserButton() {
	const { user, isAuthenticated } = useAuth();
	const [open, setOpen] = useState(false);

	if (!isAuthenticated || !user) return null;

	const userName = user.user_metadata?.full_name || user.email || "";
	const userPicture = user.user_metadata?.avatar_url;

	return (
		<>
			<button
				onClick={() => setOpen(true)}
				className="flex items-center gap-2 px-4 py-2 text-blue-800 rounded-full border hover:shadow transition"
			>
				{userPicture && (
					<img
						src={userPicture}
						alt="Avatar"
						className="w-8 h-8 rounded-full object-cover"
					/>
				)}
				<span className="text-sm font-semibold">{userName}</span>
			</button>
			<UserProfileModal
				open={open}
				setOpen={setOpen}
				user={{
					...user,
					name: userName,
					email: user.email ?? "",
					picture: userPicture,
				}}
			/>
		</>
	);
}
