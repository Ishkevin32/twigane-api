import { Subscription } from '../model/subscription';
import * as factory from './handlerFactory';

export const getAllSubscriptions = factory.getAll(Subscription);
export const getSubscription = factory.getOne(Subscription);
export const createSubscription = factory.createOne(Subscription);
export const updateSubscription = factory.updateOne(Subscription);
export const deleteSubscription = factory.deleteOne(Subscription);
