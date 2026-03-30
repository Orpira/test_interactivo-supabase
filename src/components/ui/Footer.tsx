import { FaGithub, FaTwitter, FaLinkedin } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-200 text-white px-4 py-3 shadow-lg relative z-30">
      <div className="flex flex-col text-black md:flex-row items-center justify-between max-w-5xl mx-auto gap-4">
        <p>
          © {new Date().getFullYear()}{" "}
          <strong>
            <a href="/">WebWiz Quiz</a>
          </strong>
          . Todos los derechos reservados. <br />
          Desarrollado por{" "}
          <a
            href="https://github.com/orpira"
            className="text-blue-900 hover:underline font-semibold"
            target="_blank"
            rel="noopener noreferrer"
          >
            Orlando Pineda Raad
          </a>
        </p>
        <div className="flex gap-6 justify-center mt-2 md:mt-0">
          <a
            href="https://github.com/orpira"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <FaGithub className="w-7 h-7 hover:text-blue-300 transition-colors" />
          </a>
          <a
            href="https://twitter.com/your_twitter"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
          >
            <FaTwitter className="w-7 h-7 hover:text-blue-300 transition-colors" />
          </a>
          <a
            href="https://linkedin.com/in/your_linkedin"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <FaLinkedin className="w-7 h-7 hover:text-blue-300 transition-colors" />
          </a>
        </div>
      </div>
    </footer>
  );
}
