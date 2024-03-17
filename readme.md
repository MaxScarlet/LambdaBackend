# Middleware API for AWS Lambda

This Node.js project provides a robust middleware solution designed to interface with AWS Lambda functions. It leverages Express.js to create a server environment, openapi-backend for API operations based on OpenAPI specifications, and Swagger UI for API documentation and testing.

## Features

- **Express Server**: Utilizes Express.js for handling HTTP requests and serving static files, including custom Swagger UI themes.
- **OpenAPI Integration**: Routes API requests according to an OpenAPI definition, allowing for a well-defined API structure and easy maintenance.
- **Swagger UI**: Incorporates Swagger UI for interactive API documentation, enabling users to test API endpoints directly from the browser.
- **Environment Configuration**: Supports dynamic environment configurations, making it easy to adapt the application to different deployment environments using .env files.
- **Multipart/Form-data Support**: Handles multipart/form-data requests, essential for file uploads and complex request structures.
- **AWS Request Conversion**: Converts incoming API requests into the format expected by AWS API Gateway, ensuring compatibility with AWS Lambda functions.
- **Region-Based Configuration**: Includes a utility function to derive short region codes from AWS region identifiers, useful for constructing region-specific resource names.

## Usage

1. **Set Up Environment Variables**: Configure your environment-specific variables in .env files:
    -_MONGO_USER_ - User that has access to your collection 
    -_MONGO_PASS_ - Password that has access to your collection
2. **Parameters for run_server.bat**
    #1 - path to the project
    #2 - folder of the service inside the project directory
    #3 - port for local proxy API server
    #4 - name of dotenv defined in the service
    #5 - any string indicates that should be run under nodemon process
    #6 - any string indicates that should be swagger re-generated

    E.g.:
    Run "BE-episodes" service that located in "D:\dev_Projects\AnyPodcast\" on port "4062" with "dev" env profile:
        run_server.bat D:\dev_Projects\AnyPodcast\ BE-episodes 4062 dev
    Run "BE-episodes" service that located in "D:\dev_Projects\AnyPodcast\" on port "4062" with "dev" env profile running under "nodemon" and with swagger re-generation:
        run_server.bat D:\dev_Projects\AnyPodcast\ BE-episodes 4062 dev nodemon swagger
3. **Run the Server**: Start the server by specifying the server folder, port, environment, and whether to regenerate Swagger documentation as command line arguments.
4. **Access the Swagger UI**: Navigate to `http://localhost:[PORT]/api-docs` to view and interact with your API's documentation.

## Contributing

Contributions are welcome! Please follow the existing code structure and document any new features or changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.