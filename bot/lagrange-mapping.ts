import assert from 'assert';
import type * as Lagrange from './type';

type PrivateUserInvoker = (message: Lagrange.PrivateMessage) => void;
type GroupUserInvoker = (message: Lagrange.GroupMessage) => void;

type MessageInvoker = PrivateUserInvoker | GroupUserInvoker;

interface CustomDescriptor<T extends MessageInvoker> {
    value?: T;
    configurable?: boolean;
    enumerable?: boolean;
    writable?: boolean;
    get?(): any;
    set?(v: any): void;
}

interface MessageInvokerStorage<T extends MessageInvoker> {
    invoker: T;
    config: Partial<Lagrange.CommonMessage>
}

class LagrangeMapper {
    private _privateUserStorage: Map<number, MessageInvokerStorage<PrivateUserInvoker>>;
    private _groupStorage: Map<number, MessageInvokerStorage<GroupUserInvoker>>;

    constructor() {
        this._privateUserStorage = new Map<number, MessageInvokerStorage<PrivateUserInvoker>>();
        this._groupStorage = new Map<number, MessageInvokerStorage<GroupUserInvoker>>();
    }

    get privateUserStorage() {
        return this._privateUserStorage;
    }

    get groupStorage() {
        return this._groupStorage;
    }
    
    public matchPrivateUser(message: Lagrange.PrivateMessage) {
        const user_id = message.user_id;
        const userStorage = this._privateUserStorage.get(user_id);
        if (userStorage) {
            userStorage.invoker(message);
        }
    }
    
    public onPrivateUser(config: Partial<Lagrange.CommonMessage>) {
        assert(config.user_id, 'onPrivateUser 中 user_id 不能为空');
        const _this = this;
        return function(target: any, propertyKey: string, descriptor: CustomDescriptor<PrivateUserInvoker>) {
            const user_id = config.user_id;
            if (_this.privateUserStorage.has(user_id)) {
                console.warn(`${propertyKey} -> 用户 ${user_id} 已经被注册过了，该操作将覆盖原本的！`);
            }
            const invoker = descriptor.value;
            _this.privateUserStorage.set(user_id, { invoker, config });
        }
    }

    public onGroupUser(config: Partial<Lagrange.CommonMessage>) {
        assert(config.user_id, 'onGroupUser 中 user_id 不能为空');
        assert(config.group_id, 'onGroupUser 中 group_id 不能为空');
        const _this = this;
        return function(target: any, propertyKey: string, descriptor: CustomDescriptor<GroupUserInvoker>) {
            
        }
    }

    public onGroup(config: Partial<Lagrange.CommonMessage>) {
        assert(config.group_id, 'onGroup 中 group_id 不能为空');
        const _this = this;
        return function(target: any, propertyKey: string, descriptor: CustomDescriptor<GroupUserInvoker>) {
            const group_id = config.group_id;
            if (_this.groupStorage.has(group_id)) {
                console.warn(`${propertyKey} -> 群 ${group_id} 已经被注册过了，该操作将覆盖原本的！`);
            }
            const invoker = descriptor.value;
            _this.groupStorage.set(group_id, { invoker, config });
        }
    }
}

const lagMapper = new LagrangeMapper();
export default lagMapper;