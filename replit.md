# 飞书多维表格数据助手插件

## Overview

This is a Feishu (Lark) Bitable plugin that provides automated data completion and synchronization capabilities for multi-dimensional tables. The plugin is built as a pure frontend application using React, TypeScript, and the Feishu Bitable JavaScript SDK (@lark-base-open/js-sdk). It allows users to automatically populate and update row data through configurable API integrations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with modern ES modules
- **UI Library**: Radix UI components with Tailwind CSS for styling
- **State Management**: Zustand for global state management
- **Data Fetching**: TanStack Query (React Query) for API state management
- **Routing**: Wouter for lightweight client-side routing

### Authentication & User Management
- **Feishu OAuth2**: Integration with Feishu's OAuth2 flow for user authentication
- **QR Code Login**: Support for Feishu QR code scanning login
- **User Context**: Maintains both Feishu base user context and authenticated user information

### Plugin Integration
- **Feishu SDK**: Deep integration with @lark-base-open/js-sdk for table operations
- **Plugin Storage**: Uses Feishu's plugin storage API for configuration persistence
- **Table Operations**: Real-time table field and record manipulation
- **Permission Management**: Advanced permission checking for multi-dimensional tables

## Key Components

### Core Services
1. **API Service** (`lib/apiService.ts`): Handles external API integrations and field creation
2. **Permission Service** (`lib/permissionService.ts`): Manages advanced table permissions and access control
3. **Data Sync Service** (`lib/dataSync.ts`): Handles data synchronization between external APIs and Bitable
4. **Auto Complete Helper** (`lib/autoCompleteHelper.ts`): Orchestrates the field completion workflow

### State Management
- **Feishu Base Store** (`hooks/useFeishuBaseStore.ts`): Global state for table data, user info, and selections
- **Permission Hooks** (`hooks/usePermission.ts`): Permission-aware data operations
- **Authentication Hooks** (`hooks/useFeishuAuth.ts`): Feishu OAuth2 flow management

### User Interface
- **Field Auto Complete**: Primary interface for data completion operations
- **Permission Manager**: Advanced permission monitoring and debugging
- **Config Manager**: JSON-based configuration management interface
- **Progress Tracking**: Real-time progress indication during bulk operations

## Data Flow

1. **Initialization**: Plugin loads and establishes connection with Feishu Bitable
2. **Authentication**: User authenticates via Feishu OAuth2 or existing session
3. **Table Context**: Plugin detects active table and loads field/record metadata
4. **Configuration**: User configures API endpoints and field mappings
5. **Field Selection**: User selects which fields to populate from available API data
6. **Data Fetching**: Plugin queries external APIs based on key field values
7. **Permission Checking**: Validates user permissions for each record/field operation
8. **Data Writing**: Updates table records with new data, tracking changes and errors
9. **Status Reporting**: Provides visual feedback on completion status with color coding

## External Dependencies

### Core Dependencies
- **@lark-base-open/js-sdk**: Feishu Bitable JavaScript SDK for table operations
- **@tanstack/react-query**: Server state management and caching
- **axios**: HTTP client for API requests
- **wouter**: Lightweight routing solution

### UI Dependencies
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **framer-motion**: Animation library for smooth transitions
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Fast build tool and development server
- **typescript**: Type safety and development experience
- **@tailwindcss/vite**: Tailwind CSS integration for Vite

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Port Configuration**: Runs on port 5000 with external host access enabled
- **HTTPS Support**: SSL certificates included for secure development

### Production Deployment
- **Replit Deployment**: Configured for Replit's autoscale deployment target
- **Build Process**: Vite production build with optimized bundling
- **Static Assets**: All assets served from the built distribution directory

### Environment Configuration
- **Multi-environment Support**: Separate configurations for local, Replit, and production
- **Environment Variables**: Vite-prefixed environment variables for client-side configuration
- **OAuth Redirects**: Configurable redirect URIs for different deployment environments

## Changelog

- June 16, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.