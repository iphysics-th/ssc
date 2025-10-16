const config = require("../config/auth.config");
const db = require("../models");

const Lecturer = db.lecturer;

// Create and Save a new Lecturer
exports.create = (req, res) => {
  //Validate request
  if(!req.body.name_th){
    res.status(400).send({message: "Contect can not be empty!"});
    return;
  }

  //Create a Lecturer
  const lecturer = new Lecturer({
    name_th:req.body.name_th,
    surname_th:req.body.surname_th,
    position_th:req.body.position_th,
    name_en:req.body.name_en,
    surname_en:req.body.surname_en,
    position_en:req.body.position_en,
    division_en:req.body.division_en,
    division_th:req.body.division_th,
    program:req.body.program,
    image:req.body.image,
    doctoral:req.body.doctoral,
    doctoral_year:req.body.doctoral_year,
    master:req.body.master,
    master_year:req.body.master_year,
    email:req.body.email
  })



  // Save Lecturer in the database
  lecturer
    .save(lecturer)
    .then(data => {
        res.send(data);
    })
    .catch(err =>{
        res.status(500).send({message: err.message || "Some error occurred while creating the Lecturer."})
    })
};

// Retrieve all Lecturer from the database.
exports.findAll = (req, res) => {
    const name_th = req.query.name_th;
  var condition = name_th ? { name_th: { $regex: new RegExp(name_th), $options: "i" } } : {};

  Lecturer.find(condition)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving Lecturer."
      });
    });
};

// Find a single Lecturer with an id
exports.findOne = (req, res) => {
    const id = req.params.id;

    Lecturer.findById(id)
      .then(data => {
        if (!data)
          res.status(404).send({ message: "Not found Lecturer with id " + id });
        else res.send(data);
      })
      .catch(err => {
        res
          .status(500)
          .send({ message: "Error retrieving Lecturer with id=" + id });
      });
};

// Update a Lecturer by the id in the request
exports.update = (req, res) => {
    if (!req.body) {
        return res.status(400).send({
          message: "Data to update can not be empty!"
        });
      }
    
      const id = req.params.id;
    
      Lecturer.findByIdAndUpdate(id, req.body, { useFindAndModify: false })
        .then(data => {
          if (!data) {
            res.status(404).send({
              message: `Cannot update Lecturer with id=${id}. Maybe Lecturer was not found!`
            });
          } else res.send({ message: "Lecturer was updated successfully." });
        })
        .catch(err => {
          res.status(500).send({
            message: "Error updating Lecturer with id=" + id
          });
        });
};

// Delete a Lecturer with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;

    Lecturer.findByIdAndRemove(id)
      .then(data => {
        if (!data) {
          res.status(404).send({
            message: `Cannot delete Lecturer with id=${id}. Maybe Lecturer was not found!`
          });
        } else {
          res.send({
            message: "Lecturer was deleted successfully!"
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: "Could not delete Lecturer with id=" + id
        });
      });
};

// Delete all Lecturer from the database.
exports.deleteAll = (req, res) => {
    Lecturer.deleteMany({})
    .then(data => {
      res.send({
        message: `${data.deletedCount} Lecturer were deleted successfully!`
      });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all Lecturer."
      });
    });
};




// exports.getSpecific = (req, res) => {
//     try {
//         // Extract name_en query parameter
//         const name_en = req.query.name_en;

//         // If name_en is provided, find the lecturer by name_en using a case-insensitive query
//         // Otherwise, return all lecturers
//         const query = name_en ? { name_en: new RegExp(name_en, 'i') } : {};

//         console.log("MongoDB Query:", query); // Debugging statement

//         lecturer.find(query);
        
//         // res.status(200).json(lecturers);
//         res.status(200).json({ttt:"get specific!!"});
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
//   };


// Retrieve lecturers by divisions
exports.findDivisions = async (req, res) => {
  try {
      const divisions = await Lecturer.aggregate([
          { $group: { _id: "$division_en", division_th: { $first: "$division_th" }, lecturerCount: { $sum: 1 } } },
          { $project: { _id: 0, division_en: "$_id", division_th: 1, lecturerCount: 1 } }
      ]);
      res.json(divisions);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};

// Retrieve lecturers in a specific division
exports.findByDivision = async (req, res) => {
  try {
      const divisionData = await Lecturer.find({ division_en: req.params.division_en })
          .select('name_th surname_th name_en division_th bachelor_year position_en doctoral');
      res.json(divisionData);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};

// Retrieve a specific lecturer by division and name
exports.findLecturer = async (req, res) => {
  try {
      const lecturerProfile = await Lecturer.findOne({ division_en: req.params.division_en, name_en: req.params.name_en })
          .select('name_th surname_th position_en name_en surname_en division_en division_th program image doctoral doctoral_year master master_year bachelor bachelor_year specialty industrial paper grant patent email');
      
      if (!lecturerProfile) {
          return res.status(404).send('Lecturer not found');
      }
      res.json(lecturerProfile);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
};

exports.findSpecific = async (req, res) => {
    try {
        const name_en = req.query.name_en;
        const query = name_en ? { name_en: new RegExp(name_en, 'i') } : {};
        const lecturers = await Lecturer.find(query);
        res.json(lecturers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.findDivisions = async (req, res) => {
    try {
        const divisions = await Lecturer.aggregate([
            {
                $group: {
                    _id: "$division_en",
                    division_th: { $first: "$division_th" },
                    lecturerCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    division_en: "$_id",
                    division_th: 1,
                    lecturerCount: 1
                }
            }
        ]);
        res.json(divisions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.findByDivision = async (req, res) => {
    try {
        const divisionData = await Lecturer.find({ division_en: req.params.division_en })
            .select('name_th surname_th name_en division_th bachelor_year position_en doctoral');
        res.json(divisionData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.findLecturerProfile = async (req, res) => {
    try {
        const { division_en, name_en } = req.params;
        const lecturerProfile = await Lecturer.findOne({ division_en: division_en, name_en: name_en })
            .select('name_th surname_th position_en name_en surname_en division_en division_th program image doctoral doctoral_year master master_year bachelor bachelor_year specialty industrial paper grant patent email');
        if (!lecturerProfile) {
            return res.status(404).send('Lecturer not found');
        }
        res.json(lecturerProfile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.findAllLecturers = async (req, res) => {
    try {
        const divisionQuery = req.query.division;
        const query = divisionQuery ? { division_en: divisionQuery } : {};
        const lecturers = await Lecturer.find(query);
        res.json(lecturers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
