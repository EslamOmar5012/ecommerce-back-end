import { Model, UpdateQuery, QueryOptions } from 'mongoose';

export abstract class DbRepo<T> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: Record<string, any>): Promise<T> {
    const document = new this.model(data);
    return document.save() as Promise<T>;
  }

  async findOne(
    filter: Record<string, any>,
    projection?: Record<string, unknown>,
    options?: QueryOptions<T>,
  ): Promise<T | null> {
    return this.model.findOne(filter as any, projection, options).exec();
  }

  async findById(
    id: string,
    projection?: Record<string, unknown>,
    options?: QueryOptions<T>,
  ): Promise<T | null> {
    return this.model.findById(id, projection, options).exec();
  }

  async findAll(
    filter: Record<string, any> = {},
    projection?: Record<string, unknown>,
    options?: QueryOptions<T>,
  ): Promise<T[]> {
    return this.model.find(filter as any, projection, options).exec();
  }

  async updateById(
    id: string,
    data: UpdateQuery<T>,
    options: QueryOptions<T> = { new: true },
  ): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, options).exec();
  }

  async updateOne(
    filter: Record<string, any>,
    data: UpdateQuery<T>,
    options: QueryOptions<T> = { new: true },
  ): Promise<T | null> {
    return this.model.findOneAndUpdate(filter as any, data, options).exec();
  }

  async deleteById(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async deleteOne(filter: Record<string, any>): Promise<T | null> {
    return this.model.findOneAndDelete(filter as any).exec();
  }

  async exists(filter: Record<string, any>): Promise<boolean> {
    const result = await this.model.exists(filter as any);
    return !!result;
  }

  async countDocuments(filter: Record<string, any> = {}): Promise<number> {
    return this.model.countDocuments(filter as any).exec();
  }
}
