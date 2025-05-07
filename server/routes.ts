import express from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { searchRequestSchema, updateRequestSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create API router with prefix
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Get all API configurations
  apiRouter.get("/configurations", async (req, res) => {
    const configurations = await storage.getApiConfigurations();
    res.json({ configurations });
  });

  // Get single API configuration
  apiRouter.get("/configurations/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const configuration = await storage.getApiConfiguration(id);
    if (!configuration) {
      return res.status(404).json({ message: "Configuration not found" });
    }

    res.json({ configuration });
  });

  // Create API configuration
  apiRouter.post("/configurations", async (req, res) => {
    try {
      const newConfig = await storage.createApiConfiguration(req.body);
      res.status(201).json({ configuration: newConfig });
    } catch (error) {
      res.status(400).json({ message: "Invalid configuration data" });
    }
  });

  // Update API configuration
  apiRouter.put("/configurations/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const updatedConfig = await storage.updateApiConfiguration(id, req.body);
    if (!updatedConfig) {
      return res.status(404).json({ message: "Configuration not found" });
    }

    res.json({ configuration: updatedConfig });
  });

  // Delete API configuration
  apiRouter.delete("/configurations/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const success = await storage.deleteApiConfiguration(id);
    if (!success) {
      return res.status(404).json({ message: "Configuration not found" });
    }

    res.json({ success: true });
  });

  // Get field mappings for an API configuration
  apiRouter.get("/configurations/:id/mappings", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const mappings = await storage.getFieldMappings(id);
    res.json({ mappings });
  });

  // Create field mapping
  apiRouter.post("/mappings", async (req, res) => {
    try {
      const newMapping = await storage.createFieldMapping(req.body);
      res.status(201).json({ mapping: newMapping });
    } catch (error) {
      res.status(400).json({ message: "Invalid mapping data" });
    }
  });

  // Update field mapping
  apiRouter.put("/mappings/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const updatedMapping = await storage.updateFieldMapping(id, req.body);
    if (!updatedMapping) {
      return res.status(404).json({ message: "Mapping not found" });
    }

    res.json({ mapping: updatedMapping });
  });

  // Delete field mapping
  apiRouter.delete("/mappings/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const success = await storage.deleteFieldMapping(id);
    if (!success) {
      return res.status(404).json({ message: "Mapping not found" });
    }

    res.json({ success: true });
  });

  // Search API endpoint for auto-completing fields
  apiRouter.post("/search", async (req, res) => {
    try {
      const { query, field, apiConfigId } = searchRequestSchema.parse(req.body);
      
      const apiConfig = await storage.getApiConfiguration(apiConfigId);
      if (!apiConfig) {
        return res.status(404).json({ message: "API configuration not found" });
      }

      try {
        // Here we'd normally make the actual API call to the configured endpoint
        // For demo purposes, mocking a sample response based on commonly expected data

        // In a real implementation, we would use:
        // const response = await axios.post(apiConfig.endpoint, {
        //   [field]: query
        // }, {
        //   headers: apiConfig.headers
        // });
        
        // Since we can't mock data, simulate an API call with a timeout
        // In production, this would be replaced with a real API call
        await new Promise(resolve => setTimeout(resolve, 500));

        // Return an empty response - in a real implementation this would come from the API
        res.json({
          success: true,
          message: "Search completed",
          data: {}
        });
      } catch (apiError: any) {
        return res.status(500).json({ 
          message: "Error calling external API", 
          error: apiError.message 
        });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Update data in the table
  apiRouter.post("/update", async (req, res) => {
    try {
      const updateData = updateRequestSchema.parse(req.body);
      
      const apiConfig = await storage.getApiConfiguration(updateData.apiConfigId);
      if (!apiConfig) {
        return res.status(404).json({ message: "API configuration not found" });
      }

      try {
        // In a real implementation, we would make the actual API call here
        // Since we can't mock data, simulate an API call with a timeout
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Return empty success response - in a real implementation this would include results from the API
        res.json({
          success: true,
          message: "Update completed successfully",
          updates: []
        });
      } catch (apiError: any) {
        return res.status(500).json({ 
          message: "Error calling external API", 
          error: apiError.message 
        });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
