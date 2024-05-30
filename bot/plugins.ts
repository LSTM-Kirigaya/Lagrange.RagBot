import type * as Lagrange from './type';

class Plugins {
    registeredPlugins: Map<string, Function>;
    constructor() {

    }
    
    public register() {
        return function(target: any, propertyKey: string, descriptor: PropertyDecorator) {

        }
    }

    public use(name: string) {
        return function(target: any, propertyKey: string, descriptor: PropertyDecorator) {

        }
    }
}

const plugins = new Plugins();
export default plugins;


class Impl {

    echo(message: Lagrange.CommonMessage) {

    }
}