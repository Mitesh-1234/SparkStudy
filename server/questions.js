export const questions={
      dsa:[
        {q:'Which data structure follows the LIFO principle?',o:['Queue','Stack','Tree','Graph'],a:1,e:'A stack follows Last In, First Out: the last inserted item is removed first.'},
        {q:'In a binary search tree, values smaller than a node are usually placed in its…',o:['Right subtree','Left subtree','Parent node','Root only'],a:1,e:'The left subtree contains smaller values; the right subtree contains larger values.'},
        {q:'Which traversal of a graph uses a queue?',o:['DFS','BFS','Inorder','Postorder'],a:1,e:'Breadth-First Search uses a queue to visit vertices level by level.'},
        {q:'What is the index of the first element in a typical C array?',o:['1','-1','0','Depends on size'],a:2,e:'C arrays use zero-based indexing, so the first element is at index 0.'},
        {q:'Which structure is commonly used to implement recursion?',o:['Stack','Queue','Heap only','Hash table'],a:0,e:'Function calls are managed using the call stack.'}
      ],
      dbms:[
        {q:'Which SQL command is used to retrieve data?',o:['GET','OPEN','SELECT','FETCH TABLE'],a:2,e:'SELECT retrieves rows and columns from one or more tables.'},
        {q:'Which key uniquely identifies each row in a table?',o:['Foreign key','Primary key','Alternate column','Duplicate key'],a:1,e:'A primary key uniquely identifies each record and cannot contain NULL values.'},
        {q:'Which normal form removes partial dependency?',o:['1NF','2NF','3NF','BCNF'],a:1,e:'Second Normal Form removes partial dependencies on a composite candidate key.'},
        {q:'Which SQL command removes all rows but keeps the table structure?',o:['DROP','DELETE DATABASE','TRUNCATE','REMOVE'],a:2,e:'TRUNCATE removes all table rows while retaining the table definition.'},
        {q:'What does a foreign key help maintain?',o:['Entity colour','Referential integrity','Sorting order','Password security'],a:1,e:'A foreign key links related tables and helps maintain referential integrity.'}
      ],
      java:[
        {q:'Which keyword is used to create an object in Java?',o:['class','new','this','static'],a:1,e:'The new keyword creates an object and allocates memory for it.'},
        {q:'Which method is the usual entry point of a Java application?',o:['start()','run()','main()','init()'],a:2,e:'The Java launcher starts execution from the main method with the standard signature.'},
        {q:'Which concept allows one class to acquire properties of another?',o:['Encapsulation','Inheritance','Abstraction only','Compilation'],a:1,e:'Inheritance allows a subclass to reuse and extend a superclass.'},
        {q:'Which collection does not allow duplicate elements?',o:['ArrayList','LinkedList','HashSet','Vector'],a:2,e:'A Set stores unique elements; HashSet is a common implementation.'},
        {q:'What is JVM?',o:['Java Variable Method','Java Virtual Machine','Joint Version Manager','Java Visual Model'],a:1,e:'The Java Virtual Machine executes Java bytecode.'}
      ],
      networks:[
        {q:'How many layers are in the OSI model?',o:['4','5','7','8'],a:2,e:'The OSI reference model has seven layers.'},
        {q:'Which protocol is connection-oriented?',o:['UDP','TCP','IP','ARP'],a:1,e:'TCP establishes a connection and provides reliable, ordered delivery.'},
        {q:'What does DNS mainly do?',o:['Encrypt files','Translate domain names to IP addresses','Assign MAC addresses','Compress packets'],a:1,e:'DNS resolves human-readable domain names to IP addresses.'},
        {q:'Which device commonly connects different networks?',o:['Hub','Repeater','Router','Keyboard'],a:2,e:'A router forwards packets between different networks.'},
        {q:'Which address is associated with a network interface at the data-link layer?',o:['MAC address','URL','Port number','Domain name'],a:0,e:'A MAC address identifies a network interface at the data-link layer.'}
      ],
      mixed:[
        {q:'Which data structure follows the LIFO principle?',o:['Queue','Stack','Tree','Graph'],a:1,e:'A stack follows Last In, First Out.'},
        {q:'Which SQL command is used to retrieve data?',o:['GET','OPEN','SELECT','FETCH TABLE'],a:2,e:'SELECT retrieves rows and columns.'},
        {q:'Which keyword is used to create an object in Java?',o:['class','new','this','static'],a:1,e:'The new keyword creates a Java object.'},
        {q:'How many layers are in the OSI model?',o:['4','5','7','8'],a:2,e:'The OSI reference model has seven layers.'},
        {q:'Which key uniquely identifies each row in a table?',o:['Foreign key','Primary key','Alternate column','Duplicate key'],a:1,e:'A primary key uniquely identifies each record.'}
      ]
    };
    