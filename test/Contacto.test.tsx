import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import Contacto from "../src/pages/Contacto";

describe("<Contacto />", () => {
	it("no tiene formulario y prepara el mensaje según el motivo", async () => {
		const user = userEvent.setup();
		const { container } = render(<Contacto />);
		expect(container.querySelector("form, textarea, input[type=text], input[type=email]")).toBeNull();

		const whatsapp = screen.getByRole("link", { name: /WhatsApp/ });
		expect(decodeURIComponent(whatsapp.getAttribute("href")!)).toContain("he encontrado un error en WebWiz Quiz");
		expect(screen.getByRole("link", { name: /abrir una incidencia en GitHub/ })).toBeInTheDocument();

		await user.click(screen.getByRole("radio", { name: "Colaborar como editor" }));
		expect(decodeURIComponent(whatsapp.getAttribute("href")!)).toContain("colaborar como editor");
		const mail = screen.getByRole("link", { name: /Email/ });
		expect(decodeURIComponent(mail.getAttribute("href")!)).toContain("subject=WebWiz Quiz · Colaborar como editor");
		expect(screen.queryByRole("link", { name: /abrir una incidencia/ })).toBeNull();
	});
});
