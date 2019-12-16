RESTful Routes

name			url			verb		desc
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
INDEX			/dogs		GET			display a list of all dogs currently in the database
NEW				/dogs/new	GET			displays a form to make a new dog
CREATE			/dogs		POST		add dot from form to database
SHOW			/dogs/:id	GET			shows info about one dog from the database

Data Associations:
one:one, one:many, many:many
- one:one: one entity is related to just one other entity
	- One book related to one author (but not necessarily the other way around)
	- One address related to one house
	- one SSN related to one person
- one:many: one entity is related to multiple other entities
	- One user can have many photos, posts, comments, etc
	- One author can write many books
	- One child has two(technically many) parents
- many:many: association goes both ways
	- students and courses
		students have multiple courses, and each course has multiple students
	- authors and books
		one author can write many books, and a book can have multiple authors

#Embedding Data
User(one):Post(many)

#Referencing Data
