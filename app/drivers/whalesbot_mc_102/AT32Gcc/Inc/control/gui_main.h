/*
 * gui_main.h
 *
 *  Created on: 2022年12月22日
 *      Author: Administrator
 */

#ifndef CONTROL_GUI_MAIN_H_
#define CONTROL_GUI_MAIN_H_

#ifdef CONTROL_GUI_MAIN_H_


//参数设置
#define CH   1//中文
#define EN   2//英文

//En，CH;中英文选择,根据范围判断参数是否合法
int Assert_EnOrCH(int value);


//界面主操作线程
void gui_main(void);


#endif /* CONTROL_GUI_MAIN_H_ */
#endif /* CONTROL_GUI_MAIN_H_ */
