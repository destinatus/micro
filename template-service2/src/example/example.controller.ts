import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern } from '@nestjs/microservices';

@Controller()
export class ExampleController {
  @MessagePattern({ cmd: 'sum' })
  async sum(data: number[]): Promise<number> {
    return (data || []).reduce((a, b) => a + b, 0);
  }

  @EventPattern('example_event')
  async handleEvent(data: Record<string, unknown>) {
    console.log('Event received:', data);
  }
}
