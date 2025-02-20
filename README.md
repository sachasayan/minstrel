# Minstrel

Minstrel is an application designed to facilitate collaborative novel writing between a user and an AI model. It aims to address common challenges faced by writers, such as writer's block, structuring long narratives, and maintaining consistency.

## Features

- **AI-Assisted Novel Writing:** Minstrel guides users through a structured novel-writing process, from initial story skeleton to detailed outlines and chapter generation, with AI assistance at each stage.
- **Multi-Agent Workflow:** Utilizes a multi-agent architecture with a routing agent and specialized agents (criticAgent, outlineAgent, writerAgent) for efficient task delegation and processing.
- **Iterative Process:** Supports iterative writing, allowing users to revisit and refine any part of their novel, including skeletons, outlines, and chapters.
- **Contextual Awareness:** Provides the AI model with relevant context at each stage, ensuring consistency and coherence in the generated content.
- **User Customization:** Enables users to customize story parameters and edit AI-generated content to align with their creative vision.

## Technologies Used

Minstrel is build on Electron, React, Vite, Typescript, TailwindCSS, ShadCN UI, Lucide React, Recharts, ThreeJS, and MDXEditor. It is a bleeding-edge project using React V19, Tailwind V4, and ShadCN so it's technically not production-ready yet. As of February 2025, most of these packages are still in flux and adjusting to the React 19 transition, so expect some rough edges.

Other technologies used include:
- **State Management:** Redux
- **AI Model:** Gemini API
- **Language:** TypeScript

## Project Structure

Minstrel follows a client-server architecture:

- **Frontend (Renderer Process):** Built with React, Vite, and Electron, responsible for the user interface, state management, and communication with the backend service.
- **Backend (Main Process):** Built with Node.js, handles file system operations and interacts with the Gemini API.

## Memory Bank

Forking the project? Using an AI-enabled LLM? This project is set up with a Cline-compatible Memory Bank to maintain development context. The Memory Bank consists of the following core files:

- `projectBrief.md`: Defines the project's core requirements and goals. Should not be modified by the LLM, only the user.
- `productContext.md`: Descries the project's overall purpose, problems it solves, and user experience goals.
- `techContext.md`: Contains system architecture, technologies used, development setup, and dependencies.
- `progress.md`: Outlines the phased development plan and progress.
- `activeContext.md`: Tracks the current work focus and development status.

## Requirements

- Minstrel is built with Node.js and requires Node.js 18 or higher to run.
- Minstrel is currently only tested and supported on MacOS with Apple Silicon.
- It may work on other platforms with some tweaking, but it's not guaranteed. Project reading/saving is likely to fail. Look into fileOps.ts for more details.
- If you create a Windows-compatible fork, please submit a pull request!

## Getting Started

To run Minstrel locally:
1.  Clone the repository.
2.  Install dependencies using `npm install`.
4.  Run the application using `npm run dev`.
3.  Obtain an API key for the Gemini API and set it in the application settings.
4.  Optional: Set your project directory.

## License

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

It's yours, y'all. Do what you want with it. Just don't sue me.
