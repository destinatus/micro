import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../src/database/database.service';
import { ConfigModule } from '@nestjs/config';
import configuration from '../src/config/configuration';
import { DatabaseModule } from '../src/database/database.module';

describe('DatabaseService (e2e)', () => {
  let service: DatabaseService;
  let module: TestingModule;

  beforeAll(async () => {
    // Create the NestJS testing module
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [configuration],
          isGlobal: true,
        }),
        DatabaseModule,
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    // Clean up all test data
    const users = await service.getAllUsers();
    for (const user of users) {
      await service.deleteUser(user.id);
    }
    // Close the module
    await module.close();
  });

  beforeEach(async () => {
    // Clean up any remaining test data before each test
    const users = await service.getAllUsers();
    for (const user of users) {
      await service.deleteUser(user.id);
    }
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should connect to the database', async () => {
      const users = await service.getAllUsers();
      expect(Array.isArray(users)).toBeTruthy();
    });
  });

  describe('User Operations', () => {
    describe('createUser', () => {
      it('should create a new user', async () => {
        const username = 'testuser';
        const email = 'testuser@example.com';

        const result = await service.createUser(username, email);
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.username).toBe(username);
        expect(result.email).toBe(email);
        expect(result.needs_sync).toBe(false);
        expect(result.created_at).toBeDefined();
        expect(result.updated_at).toBeDefined();
        expect(result.last_synced_at).toBeNull();
      });

      it('should create multiple users', async () => {
        const users = [
          { username: 'user1', email: 'user1@example.com' },
          { username: 'user2', email: 'user2@example.com' },
        ];

        const createdUsers = await Promise.all(
          users.map((user) => service.createUser(user.username, user.email)),
        );

        expect(createdUsers).toHaveLength(2);
        expect(createdUsers[0].username).toBe('user1');
        expect(createdUsers[1].username).toBe('user2');
      });
    });

    describe('getUser', () => {
      it('should get a user by id', async () => {
        const username = 'testuser';
        const email = 'testuser@example.com';

        const createdUser = await service.createUser(username, email);
        const retrievedUser = await service.getUser(createdUser.id);

        expect(retrievedUser).toBeDefined();
        expect(retrievedUser?.id).toBe(createdUser.id);
        expect(retrievedUser?.username).toBe(username);
        expect(retrievedUser?.email).toBe(email);
      });

      it('should return null for non-existent user', async () => {
        const result = await service.getUser(99999);
        expect(result).toBeNull();
      });
    });

    describe('updateUser', () => {
      it('should update a user', async () => {
        const username = 'testuser';
        const email = 'testuser@example.com';

        const createdUser = await service.createUser(username, email);
        const updatedUser = await service.updateUser(
          createdUser.id,
          'updateduser',
          'updated@example.com',
        );

        expect(updatedUser).toBeDefined();
        expect(updatedUser.id).toBe(createdUser.id);
        expect(updatedUser.username).toBe('updateduser');
        expect(updatedUser.email).toBe('updated@example.com');
        expect(updatedUser.needs_sync).toBe(true);
        expect(updatedUser.updated_at).not.toBe(createdUser.updated_at);
      });

      it('should partially update a user', async () => {
        const createdUser = await service.createUser(
          'testuser',
          'test@example.com',
        );
        // Update only username
        const updatedUser1 = await service.updateUser(
          createdUser.id,
          'newusername',
        );
        expect(updatedUser1.username).toBe('newusername');
        expect(updatedUser1.email).toBe('test@example.com');

        // Update only email
        const updatedUser2 = await service.updateUser(
          createdUser.id,
          undefined,
          'new@example.com',
        );
        expect(updatedUser2.username).toBe('newusername');
        expect(updatedUser2.email).toBe('new@example.com');
      });
    });

    describe('Sync Operations', () => {
      it('should handle sync status correctly', async () => {
        // Create a user
        const user = await service.createUser('syncuser', 'sync@example.com');
        expect(user.needs_sync).toBe(false);
        // Update user to trigger sync needed
        const updatedUser = await service.updateUser(user.id, 'syncuser2');
        expect(updatedUser.needs_sync).toBe(true);
        // Get unsynced users
        const unsynced = await service.getUnsynced();
        expect(unsynced.length).toBeGreaterThan(0);
        expect(unsynced.some((u) => u.id === user.id)).toBeTruthy();
        // Mark as synced
        await service.markSynced(user.id);
        // Verify sync status
        const syncedUser = await service.getUser(user.id);
        expect(syncedUser?.needs_sync).toBe(false);
        expect(syncedUser?.last_synced_at).toBeDefined();
      });
    });

    describe('deleteUser', () => {
      it('should delete a user', async () => {
        const user = await service.createUser(
          'deleteuser',
          'delete@example.com',
        );
        await service.deleteUser(user.id);
        const deletedUser = await service.getUser(user.id);
        expect(deletedUser).toBeNull();
      });

      it('should handle deleting non-existent user', async () => {
        await expect(service.deleteUser(99999)).rejects.toThrow();
      });
    });
  });
});
