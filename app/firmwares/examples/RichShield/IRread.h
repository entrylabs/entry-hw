#ifndef IR_READ_H
#define IR_READ_H

#include <Arduino.h>

int readIR(unsigned long read) {
	switch(read) {
	case 0xFFA25D: return 10; //CH-
	break;
	case 0xFF629D: return 11; //CH
	break;
	case 0xFFE21D: return 12; //CH+
	break;
	case 0xFF22DD: return 20; //prev
	break;
	case 0xFF02FD: return 21; //next
	break;
	case 0xFFC23D: return 22; //play
	break;
	case 0xFFE01F: return 30; //vol-
	break;
	case 0xFFA857: return 31; //vol+
	break;
	case 0xFF906F: return 32; //eq
	break;
	case 0xFF9867: return 100; //100+
	break;
	case 0xFFB04F: return 200; //200+
	break;
	case 0xFF6897: return 0; //0
	break;
	case 0xFF30CF: return 1; //1
	break;
	case 0xFF18E7: return 2; //2
	break;
	case 0xFF7A85: return 3; //3
	break;
	case 0xFF10EF: return 4; //4
	break;
	case 0xFF38C7: return 5; //5
	break;
	case 0xFF5AA5: return 6; //6
	break;
	case 0xFF42BD: return 7; //7
	break;
	case 0xFF4AB5: return 8; //8
	break;
	case 0xFF52AD: return 9; //9
	break;
  default:
  return -1;
  break;
	}
}

#endif
