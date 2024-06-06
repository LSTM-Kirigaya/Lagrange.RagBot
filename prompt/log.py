from __future__ import annotations
from typing import Callable
import asyncio
import sys
from weakref import WeakSet

import json


class AsyncWorker:
    worker_fn: Callable
    task_pool: WeakSet
    loop: asyncio.AbstractEventLoop | None
    cb: Callable | None
    
    def __init__(self, worker_fn: Callable, cb: Callable = None) -> None:
        self.worker_fn = worker_fn
        self.loop = None
        self.cb = cb
        self.task_pool = WeakSet()

    def dispatch(self, *args):
        try:
            loop = self.loop or asyncio.get_event_loop()
        except RuntimeError:
            return
        
        coro = self.worker_fn(*args)
        task = loop.create_task(coro)
        
        def coor_cb(future: asyncio.Future):
            pass
        
        task.add_done_callback(coor_cb)
        self.task_pool.add(task)
    
    def stop(self):
        for task in self.task_pool:
            task.cancel()
    
    def complete_all_tasks(self): 
        return [self.complete_task(task) for task in self.task_pool]
    
    async def complete_task(self, task: asyncio.Task):
        loop = asyncio.get_event_loop()
        if task.get_loop() != loop:
            return
        try:
            await task
        except Exception:
            pass


async def worker(n, m):
    for i in range(n):
        for j in range(m):
            pass
    
    print('finish')

async_worker = AsyncWorker(worker)
async_worker.dispatch(1000, 1000)
async_worker.complete_all_tasks()

import time
while True:
    time.sleep(1)
    print('load')