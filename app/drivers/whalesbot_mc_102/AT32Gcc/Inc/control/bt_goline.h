/*
 * bt_run.h
 *
 *  Created on: 2023年5月4日
 *      Author: Administrator
 *      说明：蓝牙解释在线运行功能
 */

#ifndef CONTROL_BTGOLINE_H_
#define CONTROL_BTGOLINE_H_

#ifdef CONTROL_BTGOLINE_H_



//停止蓝牙巡线
void DisableBTGoline(uint8_t sPatrol_f);

//设置蓝牙巡线
void setbtgoline(
            uint8_t sPatrol_chType1,
            uint8_t schPatrolSpeed,
            uint32_t sPatrol_hwTime,
            uint8_t sPatrol_ch,
            uint8_t sPatrol_f ,
            uint8_t sPatrol_f1
);

//蓝牙巡线线程
void BT_GoLine_Thread(void);


#endif
#endif
