import { 
  ApiConfiguration, InsertApiConfiguration,
  FieldMapping, InsertFieldMapping,
  User, InsertUser
} from "@shared/schema";

// Define the storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // API Configuration methods
  getApiConfiguration(id: number): Promise<ApiConfiguration | undefined>;
  getApiConfigurations(): Promise<ApiConfiguration[]>;
  createApiConfiguration(config: InsertApiConfiguration): Promise<ApiConfiguration>;
  updateApiConfiguration(id: number, config: Partial<InsertApiConfiguration>): Promise<ApiConfiguration | undefined>;
  deleteApiConfiguration(id: number): Promise<boolean>;
  
  // Field Mapping methods
  getFieldMappings(apiConfigId: number): Promise<FieldMapping[]>;
  createFieldMapping(mapping: InsertFieldMapping): Promise<FieldMapping>;
  updateFieldMapping(id: number, mapping: Partial<InsertFieldMapping>): Promise<FieldMapping | undefined>;
  deleteFieldMapping(id: number): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private apiConfigurations: Map<number, ApiConfiguration>;
  private fieldMappings: Map<number, FieldMapping>;
  private currentUserId: number;
  private currentApiConfigId: number;
  private currentFieldMappingId: number;

  constructor() {
    this.users = new Map();
    this.apiConfigurations = new Map();
    this.fieldMappings = new Map();
    this.currentUserId = 1;
    this.currentApiConfigId = 1;
    this.currentFieldMappingId = 1;
    
    // Initialize with some default data
    const defaultApiConfig: ApiConfiguration = {
      id: this.currentApiConfigId++,
      name: "企业工商数据",
      endpoint: "https://api.example.com/company",
      headers: { "Content-Type": "application/json" },
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    this.apiConfigurations.set(defaultApiConfig.id, defaultApiConfig);
    
    const defaultMappings: InsertFieldMapping[] = [
      { api_configuration_id: defaultApiConfig.id, source_field: "法定代表人", target_field: "联系人", is_active: true },
      { api_configuration_id: defaultApiConfig.id, source_field: "注册资本", target_field: "资金规模", is_active: true },
      { api_configuration_id: defaultApiConfig.id, source_field: "注册地址", target_field: "办公地址", is_active: true },
      { api_configuration_id: defaultApiConfig.id, source_field: "成立日期", target_field: "成立时间", is_active: true },
      { api_configuration_id: defaultApiConfig.id, source_field: "经营范围", target_field: "业务描述", is_active: false },
    ];
    
    for (const mapping of defaultMappings) {
      const newMapping: FieldMapping = {
        ...mapping,
        id: this.currentFieldMappingId++,
        created_at: new Date(),
        updated_at: new Date(),
      };
      this.fieldMappings.set(newMapping.id, newMapping);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  // API Configuration methods
  async getApiConfiguration(id: number): Promise<ApiConfiguration | undefined> {
    return this.apiConfigurations.get(id);
  }

  async getApiConfigurations(): Promise<ApiConfiguration[]> {
    return Array.from(this.apiConfigurations.values());
  }

  async createApiConfiguration(config: InsertApiConfiguration): Promise<ApiConfiguration> {
    const id = this.currentApiConfigId++;
    const newConfig: ApiConfiguration = {
      ...config,
      id,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.apiConfigurations.set(id, newConfig);
    return newConfig;
  }

  async updateApiConfiguration(id: number, config: Partial<InsertApiConfiguration>): Promise<ApiConfiguration | undefined> {
    const existingConfig = this.apiConfigurations.get(id);
    if (!existingConfig) return undefined;

    const updatedConfig: ApiConfiguration = {
      ...existingConfig,
      ...config,
      updated_at: new Date(),
    };
    this.apiConfigurations.set(id, updatedConfig);
    return updatedConfig;
  }

  async deleteApiConfiguration(id: number): Promise<boolean> {
    return this.apiConfigurations.delete(id);
  }

  // Field Mapping methods
  async getFieldMappings(apiConfigId: number): Promise<FieldMapping[]> {
    return Array.from(this.fieldMappings.values()).filter(
      (mapping) => mapping.api_configuration_id === apiConfigId
    );
  }

  async createFieldMapping(mapping: InsertFieldMapping): Promise<FieldMapping> {
    const id = this.currentFieldMappingId++;
    const newMapping: FieldMapping = {
      ...mapping,
      id,
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.fieldMappings.set(id, newMapping);
    return newMapping;
  }

  async updateFieldMapping(id: number, mapping: Partial<InsertFieldMapping>): Promise<FieldMapping | undefined> {
    const existingMapping = this.fieldMappings.get(id);
    if (!existingMapping) return undefined;

    const updatedMapping: FieldMapping = {
      ...existingMapping,
      ...mapping,
      updated_at: new Date(),
    };
    this.fieldMappings.set(id, updatedMapping);
    return updatedMapping;
  }

  async deleteFieldMapping(id: number): Promise<boolean> {
    return this.fieldMappings.delete(id);
  }
}

export const storage = new MemStorage();
