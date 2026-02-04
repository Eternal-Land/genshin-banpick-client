import enkanomiyaBg from "@/assets/image/enkanomiya-bg.png";

export default function PlayerSideBackground() {
	return (
		<div
			className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center fixed"
			style={{ backgroundImage: `url(${enkanomiyaBg})` }}
			aria-hidden="true"
		>
			<div
				className="absolute inset-0"
				style={{
					backgroundColor: "#000E24",
					opacity: 0.8,
					backdropFilter: "blur(7.5px)",
					WebkitBackdropFilter: "blur(7.5px)",
				}}
			/>
		</div>
	);
}
