import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('PropSync API')
  .setDescription(
    `## PropSync - Property Management & Service Coordination System

### Role-Based Access Control
Pass the user role in the **\`role\`** header with every request.

| Role | Value |
|------|-------|
| Owner | \`owner\` |
| Manager | \`manager\` |
| Maintenance Manager | \`maintenance_manager\` |
| Service Provider | \`service_provider\` |
| Admin | \`admin\` |

### Modules
- **Users** - User registration and management
- **Complaints** - Maintenance request lifecycle
- **Service Estimates** - Cost estimation workflow
- **Service Bills** - Bill generation and penalties
- **Payments** - Payment processing
- **Notifications** - System and manual notifications
- **Ratings** - Owner feedback on completed work
    `,
  )
  .setVersion('1.0')
  .addApiKey(
    {
      type: 'apiKey',
      in: 'header',
      name: 'role',
      description:
        'User role header - one of: owner | maintenance_manager | service_provider | admin',
    },
    'role',
  )
  .build();
