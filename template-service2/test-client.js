const { ClientProxy, ClientProxyFactory, Transport } = require('@nestjs/microservices');

async function testService() {
  const client = ClientProxyFactory.create({
    transport: Transport.TCP,
    options: {
      host: 'template-service',
      port: 3001,
    },
  });

  try {
    // Test sum endpoint
    console.log('Testing sum endpoint...');
    const sumResult = await client.send({ cmd: 'sum' }, [1, 2, 3, 4, 5]).toPromise();
    console.log('Sum result:', sumResult);

    // Test event endpoint
    console.log('\nTesting event endpoint...');
    await client.emit('example_event', { message: 'Test event' }).toPromise();
    console.log('Event sent successfully');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

testService();
