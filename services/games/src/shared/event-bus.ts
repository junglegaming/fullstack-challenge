export interface Event {
  type: string;
  payload: any;
}

export class EventBus {
  async publish(event: Event) {
    console.log('Event published:', event);

    // implement RabbitMQ in future
  }
}