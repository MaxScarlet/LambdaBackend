import cors from "cors";
import * as dotenv from "dotenv";
import express, { Response } from "express";
import fs from "fs";
import type { Context, Request } from "openapi-backend";
import { OpenAPIBackend } from "openapi-backend";
import path from "path";
import swaggerUi from "swagger-ui-express";

import { Operation, getAwsRequestEvent } from "./api_helper";
import { SwaggerExport } from "./swagger/swagger_gen";

// ::: Parse command line parameters (starting from #2, first two are system reserved) :::
const srvFolder = process.argv[2];
const port = process.argv[3] || 4001;
const srvEnv = process.argv[4];
const swaggerRegen = process.argv[5];
const region = "il-central-1";
const UploadFolder = "upload";
dotenv.config();

// ::: Read package info :::
const jsonStr = fs.readFileSync(path.join(srvFolder, "package.json"));
const packageJson = JSON.parse(jsonStr.toString());

const regionShort = (region: string) => {
	switch (region) {
		case "us-east-1":
		case "us-east-2":
			return "us-e";
		case "us-west-1":
		case "us-west-2":
			return "us-w";

		case "af-south-1":
			return "af";

		case "ap-east-1":
			return "ap-e";
		case "ap-south-1":
			return "ap-s";
		case "ap-northeast-3":
		case "ap-northeast-2":
		case "ap-northeast-1":
			return "ap-ne";
		case "ap-southeast-1":
		case "ap-southeast-2":
			return "ap-se";

		case "ca-central-1":
			return "ca";

		case "eu-central-1":
		case "eu-west-1":
		case "eu-west-2":
		case "eu-west-3":
		case "eu-north-1":
		case "eu-south-1":
			return "eu";

		case "il-central-1":
			return "il";
		case "me-south-1":
			return "me";
		case "sa-east-1":
			return "sa";
		default:
			return "";
	}
};

// ::: import required environment variables :::
let envVars: any = {};
const envPath = path.join(srvFolder, `.env.${srvEnv}`);
if (fs.existsSync(envPath)) {
	// if there is a .env file - use it
	const env = dotenv.config({ path: envPath });
	envVars = env.parsed;
} else {
	const shortReg = regionShort(region);

	envVars.DB_NAME = `${packageJson.project}-${srvEnv}`;
	envVars.DB_TABLE = packageJson.main_entity;
	envVars.ENV = srvEnv;
	envVars.REGION = region;
	envVars.BUCKET = `web${shortReg ? `.${shortReg}` : ""}.oxymoron-tech.com`;
	envVars.BUCKET_PATH = `${UploadFolder}/${packageJson.project}/${process.env.ENV ?? "local"}`;
	envVars.DB_USER = process.env.MONGO_USER ?? `admin`;
	envVars.DB_PASS = process.env.MONGO_PASS ?? `123123`;

	Object.keys(envVars).forEach((key) => {
		process.env[key] = envVars[key];
	});
}

// ::: import service's source code :::
const serviceIndexPath = path.join(srvFolder, "src/index");
const serviceIndexModule = require(serviceIndexPath);

if (swaggerRegen) {
	const exp = new SwaggerExport(srvFolder);
	const resp = exp.Generate();
	console.log(resp);
}

// ::: import swagger file from service's folder :::
const openApiFilePath = path.join(srvFolder, "swagger", "oas30_templ.json");
const openApiJson = require(openApiFilePath);
openApiJson.servers.unshift({ url: `http://localhost:${port}` }); // add local server to enable local runs from UI

// ::: generate basic API backend based on included swagger file :::
const openAPIBackend = new OpenAPIBackend({ definition: openApiJson });
// ::: extract operations names :::
const operationNames: string[] = Operation.extractOperations(openApiJson);

// ::: register operations extracted from swagger :::
const registerApi = {};
operationNames.forEach((operationName: string) => {
	registerApi[operationName] = async (
		context: Context,
		request: Request,
		res: Response,
	) => {
		try {
			const event = getAwsRequestEvent(request, context);

			// ::: call service's root handler :::
			const response = await serviceIndexModule.handler(event);

			res.status(response.statusCode).json(JSON.parse(response.body));
		} catch (error) {
			console.error(error);
			res.status(500).json({ error: "Internal server error" });
		}
	};
});

openAPIBackend.register(registerApi);
openAPIBackend.init();

const server = express();
server.use(cors());
server.use(express.static("public")); // serve custom CSS
server.use(
	"/api-docs",
	swaggerUi.serve,
	swaggerUi.setup(openApiJson, {
		customSiteTitle: `${packageJson.project} | ${packageJson.name}`,
		customCssUrl: "/swagger-dark.css",
	})
);
server.use(express.json());
server.use((req, res) => {
	openAPIBackend.handleRequest(req as Request, req, res);
});

const mainUrl = `http://localhost:${port}`;
const mainUrlSwagger = `http://localhost:${port}/api-docs`;
server.listen(port, () => {
	console.log(
		"::: Middleware API for AWS Lambda microservice ::::::::::::::::::::::::: Oxymoron Tech ::: 2024 :::"
	);
	const srvDetails =
		packageJson.project && packageJson.name
			? `for [${packageJson.project} | ${packageJson.name}]`
			: "";
	console.log(`Running API ${srvDetails} at ${srvFolder}`);

	console.log(`Variables of [${srvEnv}] environment:`);
	Object.keys(envVars).forEach((key) => console.log(`${key}: ${envVars[key]}`));

	console.log(`Listening on ${mainUrl}`);
	console.log(`Swagger UI on ${mainUrlSwagger}`);
});
