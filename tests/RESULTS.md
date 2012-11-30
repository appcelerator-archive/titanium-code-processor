Commentary on failed tests
----------------------

### Chapter 8
All tests passed

### Chapter 9
All tests passed

### Chapter 10

#### Section 1
* ch10/10.1/10.1.1/10.1.1-17-s.js
	* Technically a bug, but esoteric and fairly benign. Very difficult to find the source. Occurs in strict mode only, wrong type of exception is thrown.
* ch10/10.1/10.1.1/10.1.1-30-s.js
	* Basically the same bug as ch10/10.1/10.1.1/10.1.1-17-s.js

#### Section 2
All tests passed

#### Section 3
All tests passed

#### Section 4
* ch10/10.4/10.4.1/S10.4.1_A1_T2.js
	* Not exactly a bug, more something to consider. The Code Processor uses module scope, not global, but the test assumes global scope. Node.js fails this test too for the same reason

#### Section 5
All tests passed

#### Section 6
All tests passed

### Chapter 11

#### Section 1
* ch11/11.1/11.1.5/11.1.5_6-2-1-s.js
	* I think the test is wrong. The test references a variable instantiated inside the eval outside of the eval. From the spec: "10.4.2.1 Strict Mode Restrictions: The eval code cannot instantiate variable or function bindings in the variable environment of the calling context that invoked the eval if either the code of the calling context or the eval code is strict code. Instead such bindings are instantiated in a new VariableEnvironment that is only accessible to the eval code."
* ch11/11.1/11.1.5/11.1.5_6-2-2-s.js
	* This one is a matter of which exception takes priority. Technically both a Syntax Error and a Reference Error are valid. The Code Processor throws a reference error, but the test case says a Syntax Error should be thrown. The spec doesn't shed any light on how exception priority is handled. Since I'm not sure how to accuractly, according to the spec, resolve this issue, I'm leaving as is.
* ch11/11.1/11.1.5/11.1.5_7-2-1-s.js
	* Same issue as ch11/11.1/11.1.5/11.1.5_6-2-1-s.js
* ch11/11.1/11.1.5/11.1.5_7-2-2-s.js
	* Same issue as ch11/11.1/11.1.5/11.1.5_6-2-2-s.js

#### Section 2
* ch11/11.2/11.2.1/S11.2.1_A4_T1.js
	* Same issue as ch10/10.4/10.4.1/S10.4.1_A1_T2.js
* ch11/11.2/11.2.1/S11.2.1_A4_T9.js
	* The failures in this test are from the compatibility (with ECMAScript 3) section of the spec (appendix B)

#### Section 3
All tests passed

#### Section 4
* ch11/11.4/11.4.1/11.4.1-3-a-1-s.js
	* Same issue as ch11/11.1/11.1.5/11.1.5_6-2-1-s.js
* ch11/11.4/11.4.1/11.4.1-4.a-8-s.js
	* Same issue as ch10/10.4/10.4.1/S10.4.1_A1_T2.js (I think)

#### Section 5
All tests passed

#### Section 6
* ch11/11.6/11.6.1/S11.6.1_A2.2_T2.js
	* This is a legitimate bug, but since it only affects exact mode, I'm ignoring it for now

#### Section 7
All tests passed

#### Section 8
* ch11/11.8/11.8.6/S11.8.6_A6_T3.js
	* This bug is tricky cause it relates to object prototypes and the recusrive referencing issue. The seemingly obvious fix would break other tests.

#### Section 9
All tests passed

#### Section 10
All tests passed

#### Section 11
All tests passed

#### Section 12
All tests passed

#### Section 13
* ch11/11.13/11.13.1/11.13.1-4-1.js
	* Same issue as ch10/10.4/10.4.1/S10.4.1_A1_T2.js
* ch11/11.13/11.13.1/11.13.1-4-27-s.js
	* Same issue as ch10/10.4/10.4.1/S10.4.1_A1_T2.js
* ch11/11.13/11.13.1/11.13.1-4-28-s.js
	* I have no idea what this test is doing. It starts by throwing an error, even though the code it wants to test is after the throw
* ch11/11.13/11.13.1/11.13.1-4-29-s.js
	* Same issue as ch10/10.4/10.4.1/S10.4.1_A1_T2.js
* ch11/11.13/11.13.1/11.13.1-4-3-s.js
	* Same issue as ch10/10.4/10.4.1/S10.4.1_A1_T2.js

#### Section 14
All tests passed

### Chapter 12

#### Section 1
All tests passed

#### Section 2
* ch12/12.2/12.2.1/12.2.1-1-s.js
	* This is, arguably, a bug in uglify. We may need to consider doing a three pass evaluation of code, with the first being a syntax check that is strict mode aware
* ch12/12.2/12.2.1/12.2.1-12-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.2/12.2.1/12.2.1-14-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.2/12.2.1/12.2.1-3-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.2/12.2.1/12.2.1-28-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.2/12.2.1/12.2.1-25-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.2/12.2.1/12.2.1-24-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.2/12.2.1/12.2.1-27-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.2/12.2.1/12.2.1-23-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.2/12.2.1/12.2.1-26-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.2/12.2.1/12.2.1-29-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.2/12.2.1/12.2.1-32-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.2/12.2.1/12.2.1-30-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.2/12.2.1/12.2.1-31-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.2/12.2.1/12.2.1-33-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js

#### Section 3
All tests passed

#### Section 4
All tests passed

#### Section 5
All tests passed

#### Section 6
* ch12/12.6/12.6.1/S12.6.1_A5.js
	* This bug is extremely esoteric. Most people don't even know that loops return a value. Will come back to it later.
* ch12/12.6/12.6.2/S12.6.2_A5.js
	* Same issue as ch12/12.6/12.6.1/S12.6.1_A5.js
* ch12/12.6/12.6.4/S12.6.4_A3.1.js
	* Same issue as ch12/12.6/12.6.1/S12.6.1_A5.js
* ch12/12.6/12.6.4/S12.6.4_A3.js
	* Same issue as ch12/12.6/12.6.1/S12.6.1_A5.js
* ch12/12.6/12.6.4/S12.6.4_A4.1.js
	* Same issue as ch12/12.6/12.6.1/S12.6.1_A5.js
* ch12/12.6/12.6.4/S12.6.4_A4.js
	* Same issue as ch12/12.6/12.6.1/S12.6.1_A5.js

#### Section 7
* ch12/12.7/S12.7_A6.js
	* This is technically a bug in uglify. continue/break statements throw a syntax error if not inside a loop. Uglify normally catches these, but missed this edge case

#### Section 8
* ch12/12.8/S12.8_A6.js
	* Same issue as ch12/12.7/S12.7_A6.js

#### Section 9
All tests passed

#### Section 10
* ch12/12.10/12.10.1/12.10.1-1-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.10/12.10.1/12.10.1-14-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.10/12.10.1/12.10.1-15-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.10/12.10.1/12.10.1-16-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.10/12.10.1/12.10.1-2-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.10/12.10.1/12.10.1-3-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.10/12.10.1/12.10.1-4-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js, although this one is tricker since it's part of a Function call. Maybe we could insert "use strict"; where appropriate?
* ch12/12.10/12.10.1/12.10.1-7-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.10/12.10.1/12.10.1-8-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.10/12.10.1/12.10.1-9-s.js
	* Same issue as ch12/12.2/12.2.1/12.2.1-1-s.js
* ch12/12.10/S12.10_A1.12_T4.js
	* This bug is really esoteric and very tricky to fix. Leaving it alone for now. Somehow we have to save the modified state of with() statements for later use in closures.
* ch12/12.10/S12.10_A1.12_T5.js
	* Same issue as ch12/12.10/S12.10_A1.12_T4.js
* ch12/12.10/S12.10_A1.7_T4.js
	* Not evaluating since with is discouraged and relatively unknown
* ch12/12.10/S12.10_A1.7_T5.js
	* Not evaluating since with is discouraged and relatively unknown
* ch12/12.10/S12.10_A1.8_T4.js
	* Not evaluating since with is discouraged and relatively unknown
* ch12/12.10/S12.10_A1.8_T5.js
	* Not evaluating since with is discouraged and relatively unknown
* ch12/12.10/S12.10_A3.12_T4.js
	* Not evaluating since with is discouraged and relatively unknown
* ch12/12.10/S12.10_A3.12_T5.js
	* Not evaluating since with is discouraged and relatively unknown
* ch12/12.10/S12.10_A3.3_T4.js
	* Not evaluating since with is discouraged and relatively unknown
* ch12/12.10/S12.10_A3.7_T4.js
	* Not evaluating since with is discouraged and relatively unknown
* ch12/12.10/S12.10_A3.7_T5.js
	* Not evaluating since with is discouraged and relatively unknown
* ch12/12.10/S12.10_A3.8_T4.js
	* Not evaluating since with is discouraged and relatively unknown
* ch12/12.10/S12.10_A3.8_T5.js
	* Not evaluating since with is discouraged and relatively unknown

#### Section 11
* ch12/12.11/S12.11_A2_T1.js

#### Section 12
Not Analyzed

#### Section 13
Not Analyzed

#### Section 14
Not Analyzed

### Chapter 13
Not Analyzed

### Chapter 14
Not Analyzed

### Chapter 15
Not Analyzed