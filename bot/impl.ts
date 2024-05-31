import lagrangeMapper from './lagrange-mapping';
import { apiQueryVecdb } from './api/vecdb';

import type * as Lagrange from './type';


export class Impl {

    @lagrangeMapper.onPrivateUser(1193466151)
    async handleJinhui(c: Lagrange.PrivateUserInvokeContext) {
        console.log('raw message:' + c.message.raw_message);
        
    }

}