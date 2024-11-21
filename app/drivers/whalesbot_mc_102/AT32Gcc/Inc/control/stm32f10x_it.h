/**
  **************************************************************************
  * @file     stm32f10x_it.h
  * @version  v2.0.9
  * @date     2022-04-25
  * @brief    header file of main interrupt service routines.
  **************************************************************************
  */

/* define to prevent recursive inclusion -------------------------------------*/
#ifndef __STM32F10X_IT_H
#define __STM32F10X_IT_H



/* includes ------------------------------------------------------------------*/
#include "main.h"

/* exported types ------------------------------------------------------------*/
/* exported constants --------------------------------------------------------*/
/* exported macro ------------------------------------------------------------*/
/* exported functions ------------------------------------------------------- */

void NMI_Handler(void);
void HardFault_Handler(void);
void MemManage_Handler(void);
void BusFault_Handler(void);
void UsageFault_Handler(void);
void SVC_Handler(void);
void DebugMon_Handler(void);
void PendSV_Handler(void);
void SysTick_Handler(void);


#endif


