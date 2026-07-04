import mongoose, { Model, UpdateQuery, QueryOptions } from 'mongoose';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  populate?: string | string[];
  select?: string;
  search?: string;
  searchFields?: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export abstract class DbRepo<T> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: Record<string, any>): Promise<T> {
    const document = new this.model(data);
    return document.save() as Promise<T>;
  }

  async findOne(
    filter: mongoose.QueryFilter<T>,
    projection?: Record<string, unknown>,
    options?: QueryOptions<T>,
  ): Promise<T | null> {
    return this.model.findOne(filter, projection, options).exec();
  }

  async findById(
    id: string,
    projection?: Record<string, unknown>,
    options?: QueryOptions<T>,
  ): Promise<T | null> {
    return this.model.findById(id, projection, options).exec();
  }

  async findAll(
    filter: mongoose.QueryFilter<T> = {},
    projection?: Record<string, unknown>,
    options?: QueryOptions<T>,
  ): Promise<T[]> {
    return this.model.find(filter, projection, options).exec();
  }

  async findPaginated(
    filter: mongoose.QueryFilter<T> = {},
    opts: PaginationOptions = {},
  ): Promise<PaginatedResult<T>> {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 10));
    const skip = (page - 1) * limit;

    // Build text search filter if provided
    const queryFilter: any = { ...filter };
    if (opts.search && opts.searchFields && opts.searchFields.length > 0) {
      queryFilter.$or = opts.searchFields.map((field) => ({
        [field]: { $regex: opts.search, $options: 'i' },
      }));
    }

    const sortObj = opts.sort ?? { createdAt: -1 };

    let query = this.model
      .find(queryFilter)
      .sort(sortObj as any)
      .skip(skip)
      .limit(limit);

    if (opts.populate) {
      if (Array.isArray(opts.populate)) {
        opts.populate.forEach((p) => { query = query.populate(p) as any; });
      } else {
        query = query.populate(opts.populate) as any;
      }
    }

    if (opts.select) {
      query = query.select(opts.select) as any;
    }

    const [data, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments(queryFilter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data as T[],
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async updateById(
    id: string,
    data: UpdateQuery<T>,
    options: QueryOptions<T> = { new: true },
  ): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, options).exec();
  }

  async updateOne(
    filter: mongoose.QueryFilter<T>,
    data: UpdateQuery<T>,
    options: QueryOptions<T> = { new: true },
  ): Promise<T | null> {
    return this.model.findOneAndUpdate(filter, data, options).exec();
  }

  async deleteById(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async deleteOne(filter: mongoose.QueryFilter<T>): Promise<T | null> {
    return this.model.findOneAndDelete(filter).exec();
  }

  async exists(filter: mongoose.QueryFilter<T>): Promise<boolean> {
    const result = await this.model.exists(filter);
    return !!result;
  }

  async countDocuments(filter: mongoose.QueryFilter<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }
}
