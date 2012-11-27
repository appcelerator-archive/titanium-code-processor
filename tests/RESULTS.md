Sumary of failed tests
----------------------

### Chapter 8
All tests passed

### Chapter 9
All tests passed

### Chapter 10
* ch10/10.1/10.1.1/10.1.1-17-s.js
	* Technically a bug, but esoteric and fairly benign. Very difficult to find the source. Occurs in strict mode only, wrong type of exception is thrown.
* ch10/10.1/10.1.1/10.1.1-30-s.js
	* Technically a bug, but esoteric and fairly benign. Very difficult to find the source. Occurs in strict mode only, wrong type of exception is thrown.
* ch10/10.4/10.4.1/S10.4.1_A1_T2.js
	* Not exactly a bug, more something to consider. The Code Processor uses module scope, not global, but the test assumes global scope. Node.js fails this test too for the same reason

### Chapter 11
Not Analyzed

### Chapter 12
Not Analyzed

### Chapter 13
Not Analyzed

### Chapter 14
Not Analyzed

### Chapter 15
Not Analyzed