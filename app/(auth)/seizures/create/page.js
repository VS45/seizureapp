'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function SeizureForm() {
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Updated medicine data structure with hierarchy
  const medicineData = [
    {
        type: 'Anti-Cancer',
        subtypes: [
            {
                type: 'Anti-Infective Agents',
                subtypes: [
                    'Anti-bacterial/Antibiotic',
                    'Anti-fungal',
                    'Anti-malarial',
                    'Anti-parasitic',
                    'Antiseptic and germicide',
                    'Anti-tuberculosis',
                    'Anti-viral (e.g. HIV)',
                    'Vaccines',
                    'Other'
                ]
            }
        ]
    },
    {
        type: 'Blood Agents',
        subtypes: [
            {
                type: 'Cardiovascular Agents',
                subtypes: [
                    'Anti-hypertension',
                    'Beta blocking',
                    'Cardiac therapy',
                    'Cholesterol medication',
                    'Vasodilator',
                    'Other'
                ]
            }
        ]
    },
    {
        type: 'Dermatological Agents',
        subtypes: [
            {
                type: 'Ear and Eye Agents',
                subtypes: [
                    'Ophthalmological (eye)',
                    'Ontological (ear)'
                ]
            },
            {
                type: 'Gastrointestinal Agents',
                subtypes: [
                    'Antidiarrheal',
                    'Appetite stimulant',
                    'Digestive enzyme',
                    'Laxative',
                    'Other'
                ]
            }
        ]
    },
    {
        type: 'Hair loss Agents',
        subtypes: [
            {
                type: 'Health Supplements',
                subtypes: [
                    'Herbal products',
                    'Minerals',
                    'Nutritional products',
                    'Other'
                ]
            },
            {
                type: 'Vitamins Immunological Agents',
                subtypes: [
                    'Immunostimulant',
                    'Immunosuppressive',
                    'Other'
                ]
            }
        ]
    },
    {
        type: 'Medical Devices',
        subtypes: [
            {
                type: 'Metabolic Agents',
                subtypes: [
                    'Anabolic Steroid',
                    'Androstenedione',
                    'Clenbuterol',
                    'Erythropoietin (EPO - hormones)',
                    'Growth Hormones',
                    'Methandienone',
                    'Nandrolone',
                    'Other',
                    'Oxandrolone',
                    'Oxymetholone',
                    'Stanozolol',
                    'Stenbolone',
                    'Testosterone',
                    'Anorexiant (Slimming medication)',
                    'Anti-diabetic',
                    'Other'
                ]
            },
            {
                type: 'Musculo-skeletal Agents',
                subtypes: [
                    'Anti-gout',
                    'Anti-inflammatory/Anti-rheumatic',
                    'Bone disease medication',
                    'Muscle relaxant',
                    'Other'
                ]
            },
            {
                type: 'Nervous System Agents',
                subtypes: [
                    'Anti-Alzheimer',
                    'Analgesic (painkiller)',
                    'Anesthetic',
                    'Anti-epileptic',
                    'Anti-Parkinson',
                    'Hypnotic and sedative',
                    'Other'
                ]
            },
            {
                type: 'Psychotherapeutic Agents',
                subtypes: [
                    'Anti-depressant',
                    'Anti-psychotic',
                    'Drugs to treat addiction',
                    'Other'
                ]
            },
            {
                type: 'Respiratory System Agents',
                subtypes: [
                    'Anti-asthmatic',
                    'Anti-histamine/Anti allergy',
                    'Anti-smoking',
                    'Cough and cold medication',
                    'Decongestants',
                    'Throat medication',
                    'Other'
                ]
            },
            {
                type: 'Urogenital Agents',
                subtypes: [
                    'Contraceptive',
                    'Diuretic',
                    'Erectile dysfunction',
                    'Renal medicine (kidneys)',
                    'Veterinary Agents',
                    'Other'
                ]
            }
        ]
    }
  ];

  const iprData = [
    {
      type: 'Copyright',
      subtypes: ['Books', 'Music', 'Software', 'Films', 'Photography']
    },
    {
      type: 'Trademark Right',
      subtypes: ['Brand Names', 'Logos', 'Slogans', 'Packaging']
    },
    {
      type: 'Patent Right',
      subtypes: ['Inventions', 'Processes', 'Designs', 'Utility Models']
    },
    {
      type: 'Industrial Design',
      subtypes: ['Product Shapes', 'Ornamental Designs', 'Packaging Designs']
    },
    {
      type: 'Geographical Indication',
      subtypes: ['Food Products', 'Wines', 'Handicrafts', 'Agricultural Products']
    },
    {
      type: 'Layout Design',
      subtypes: ['Integrated Circuits', 'Semiconductor Chips']
    }
  ];
  
  // State for countries and their subdivisions
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [error, setError] = useState(null);

  // State for checkpoints and warehouses
  const [checkpoints, setCheckpoints] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loadingCheckpoints, setLoadingCheckpoints] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);

  // State for selected medicine and IPR types
  const [selectedMedicineTypes, setSelectedMedicineTypes] = useState([]);
  const [selectedIPRTypes, setSelectedIPRTypes] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    // Case Reference
    countryOfSeizure: '',
    offenceLocation: '',
    offenceLocationType: '',
    offenceDateTime: new Date(),
    service: '',
    direction: '',
    offenceDescription: '', 
    
    // Commodity details (applied to all commodities)
    isIPR: false,
    iprType: '',
    goodsCategory: '',
    isMedicine: false,
    selectedMedicines: [],
    isCounterfeit: '',
    rightHolder: '',
    concealment: '',
    illicitTrade: [],
    selectedIPRs: [],
    
    // Detection
    detectionMethod: '',
    technicalAid: '',
    checkpoint: '',
    warehouse: '',
    
    // Conveyance
    conveyanceType: '',
    conveyanceNumber: '',
    
    // Route - Departure
    departureCountry: '',
    departureState: '',
    departureLocation: '',
    departurePortCode: '',
    departureTin: '',
    departureTransport: '',
    
    // Route - Destination
    destinationCountry: '',
    destinationState: '',
    destinationLocation: '',
    destinationPortCode: '',
    destinationTin: '',
    destinationTransport: '',
    
    // Pictures
    images: []
  });

  // State for commodities (only goodsType, quantity, unit)
  const [commodities, setCommodities] = useState([
    {
      goodsType: '',
      quantity: '',
      unit: '',
      containerNumber: '', // For container/lorry/bus units
      itemDescription: '', // New field for item description
    }
  ]);

  // State for persons (multiple persons)
  const [persons, setPersons] = useState([
    {
      gender: '',
      age: '',
      nationality: '',
      name: '', // Added name field
      role: '', // Added role field (e.g., driver, passenger, owner, etc.)
    }
  ]);
  
  // Fetch countries and states on component mount
  useEffect(() => {
    const fetchCountriesWithStates = async () => {
      try {
        setLoadingCountries(true);
        setError(null);
        
        const response = await fetch('https://countriesnow.space/api/v0.1/countries/states');
        const data = await response.json();
        
        if (!data.error && Array.isArray(data.data)) {
          // Format the data for easier use in our form
          const formattedCountries = data.data.map(country => ({
            name: country.name,
            iso2: country.iso2,
            states: country.states.map(state => ({
              name: state.name,
              code: state.state_code
            }))
          })).sort((a, b) => a.name.localeCompare(b.name));
          
          setCountries(formattedCountries);
        } else {
          throw new Error(data.msg || 'Failed to fetch countries');
        }
      } catch (err) {
        console.error('Error fetching countries:', err);
        setError(err.message);
        // Fallback to some basic countries if API fails
        setCountries([
          {
            name: 'Nigeria',
            iso2: 'NG',
            states: [
              { name: 'Lagos', code: 'LOS' },
              { name: 'Abuja', code: 'ABJ' },
              { name: 'Kano', code: 'KAN' }
            ]
          },
          {
            name: 'United States',
            iso2: 'US',
            states: [
              { name: 'California', code: 'CA' },
              { name: 'Texas', code: 'TX' },
              { name: 'New York', code: 'NY' }
            ]
          }
        ]);
      } finally {
        setLoadingCountries(false);
      }
    };
    
    fetchCountriesWithStates();
  }, []);

  // Fetch checkpoints and warehouses
  useEffect(() => {
    const fetchCheckpoints = async () => {
      try {
        setLoadingCheckpoints(true);
        const response = await fetch('/api/checkpoints');
        if (response.ok) {
          const data = await response.json();
          setCheckpoints(data.checkpoints);
        }
      } catch (error) {
        console.error('Error fetching checkpoints:', error);
      } finally {
        setLoadingCheckpoints(false);
      }
    };

    const fetchWarehouses = async () => {
      try {
        setLoadingWarehouses(true);
        const response = await fetch('/api/warehouses');
        if (response.ok) {
          const data = await response.json();
          setWarehouses(data.warehouses);
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error);
      } finally {
        setLoadingWarehouses(false);
      }
    };

    fetchCheckpoints();
    fetchWarehouses();
  }, []);

  // Get states for a specific country
  const getStatesForCountry = (countryName) => {
    const country = countries.find(c => c.name === countryName);
    return country ? country.states : [];
  };

  // Handle adding a new commodity
  const addCommodity = () => {
    setCommodities(prev => [
      ...prev,
      {
        goodsType: '',
        quantity: '',
        unit: '',
        containerNumber: '',
        itemDescription: '',
      }
    ]);
  };

  // Handle removing a commodity
  const removeCommodity = (index) => {
    if (commodities.length > 1) {
      setCommodities(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Handle commodity field changes
  const handleCommodityChange = (index, field, value) => {
    setCommodities(prev => {
      const updatedCommodities = [...prev];
      updatedCommodities[index] = {
        ...updatedCommodities[index],
        [field]: value,
        // Reset container number when unit changes to non-container type
        ...(field === 'unit' && !['container', 'Bus', 'Lorry','Vehicle'].includes(value) && {
          containerNumber: ''
        })
      };
      return updatedCommodities;
    });
  };

  // Handle adding a new person
  const addPerson = () => {
    setPersons(prev => [
      ...prev,
      {
        gender: '',
        age: '',
        nationality: '',
        name: '',
        role: '',
      }
    ]);
  };

  // Handle removing a person
  const removePerson = (index) => {
    if (persons.length > 1) {
      setPersons(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Handle person field changes
  const handlePersonChange = (index, field, value) => {
    setPersons(prev => {
      const updatedPersons = [...prev];
      updatedPersons[index] = {
        ...updatedPersons[index],
        [field]: value
      };
      return updatedPersons;
    });
  };

  // Handle form field changes (for seizure-wide fields)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      // Reset state when country changes
      ...(name.endsWith('Country') && {
        [name.replace('Country', 'State')]: '',
        [name.replace('Country', 'PortCode')]: '',
        [name.replace('Country', 'Tin')]: ''
      }),
      ...(name === 'countryOfSeizure' && {
        offenceLocation: ''
      })
    }));
  };

  const handleArrayChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData(prev => {
      const newArray = checked 
        ? [...prev[name], value]
        : prev[name].filter(item => item !== value);
      return { ...prev, [name]: newArray };
    });
  };

  // Handle medicine type selection
  const handleMedicineTypeChange = (medicineType) => {
    setSelectedMedicineTypes(prev => {
      if (prev.includes(medicineType)) {
        return prev.filter(type => type !== medicineType);
      } else {
        return [...prev, medicineType];
      }
    });
  };

  // Handle medicine subtype selection
  const handleMedicineSubtypeChange = (medicineType, subtypeType, subtype) => {
    setFormData(prev => {
      const existingMedicineIndex = prev.selectedMedicines.findIndex(
        med => med.type === medicineType && med.subtypeType === subtypeType
      );

      if (existingMedicineIndex >= 0) {
        const updatedMedicines = [...prev.selectedMedicines];
        const existingSubtypes = updatedMedicines[existingMedicineIndex].subtypes;

        if (existingSubtypes.includes(subtype)) {
          updatedMedicines[existingMedicineIndex] = {
            ...updatedMedicines[existingMedicineIndex],
            subtypes: existingSubtypes.filter(st => st !== subtype)
          };
        } else {
          updatedMedicines[existingMedicineIndex] = {
            ...updatedMedicines[existingMedicineIndex],
            subtypes: [...existingSubtypes, subtype]
          };
        }

        const filteredMedicines = updatedMedicines.filter(
          med => med.subtypes.length > 0
        );

        return {
          ...prev,
          selectedMedicines: filteredMedicines
        };
      } else {
        return {
          ...prev,
          selectedMedicines: [
            ...prev.selectedMedicines,
            {
              type: medicineType,
              subtypeType: subtypeType,
              subtypes: [subtype]
            }
          ]
        };
      }
    });
  };
  
  // Handle IPR type selection
  const handleIPRTypeChange = (iprType) => {
    setSelectedIPRTypes(prev => {
      if (prev.includes(iprType)) {
        return prev.filter(type => type !== iprType);
      } else {
        return [...prev, iprType];
      }
    });
  };

  // Handle IPR subtype selection
  const handleIPRSubtypeChange = (iprType, subtype) => {
    setFormData(prev => {
      const existingIPRIndex = prev.selectedIPRs.findIndex(
        ipr => ipr.type === iprType
      );

      if (existingIPRIndex >= 0) {
        const updatedIPRs = [...prev.selectedIPRs];
        const existingSubtypes = updatedIPRs[existingIPRIndex].subtypes;

        if (existingSubtypes.includes(subtype)) {
          updatedIPRs[existingIPRIndex] = {
            ...updatedIPRs[existingIPRIndex],
            subtypes: existingSubtypes.filter(st => st !== subtype)
          };
        } else {
          updatedIPRs[existingIPRIndex] = {
            ...updatedIPRs[existingIPRIndex],
            subtypes: [...existingSubtypes, subtype]
          };
        }

        const filteredIPRs = updatedIPRs.filter(
          ipr => ipr.subtypes.length > 0
        );

        return {
          ...prev,
          selectedIPRs: filteredIPRs
        };
      } else {
        return {
          ...prev,
          selectedIPRs: [
            ...prev.selectedIPRs,
            {
              type: iprType,
              subtypes: [subtype]
            }
          ]
        };
      }
    });
  };
  
  // Render medicine selection section with hierarchical structure
  const renderMedicineSelection = (formData) => (
    <div className="space-y-4 mb-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Medicine Types and Subtypes
        </label>
        
        {/* Medicine Type Selection */}
        <div className="mb-4 p-3 border border-gray-300 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Medicine Types</h4>
          <div className="flex flex-wrap gap-3">
            {medicineData.map((medicine) => (
              <label key={medicine.type} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedMedicineTypes.includes(medicine.type)}
                  onChange={() => handleMedicineTypeChange(medicine.type)}
                  className="text-green-600"
                />
                <span>{medicine.type}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Subtype Selection */}
        {selectedMedicineTypes.length > 0 && (
          <div className="p-3 border border-gray-300 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Medicine Subtypes</h4>
            <div className="space-y-3">
              {selectedMedicineTypes.map(medicineType => {
                const medicine = medicineData.find(m => m.type === medicineType);
                if (!medicine) return null;
                
                return (
                  <div key={medicineType} className="ml-4">
                    <h5 className="font-medium text-gray-700 mb-1">{medicineType}</h5>
                    <div className="space-y-3">
                      {medicine.subtypes.map(subtypeObj => (
                        <div key={subtypeObj.type} className="ml-4">
                          <h6 className="font-medium text-gray-700 mb-1">{subtypeObj.type}</h6>
                          <div className="flex flex-wrap gap-3">
                            {subtypeObj.subtypes.map(subtype => {
                              const isSelected = formData.selectedMedicines.some(
                                med => med.type === medicineType && 
                                       med.subtypeType === subtypeObj.type && 
                                       med.subtypes.includes(subtype)
                              );
                              
                              return (
                                <label key={subtype} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleMedicineSubtypeChange(medicineType, subtypeObj.type, subtype)}
                                    className="text-green-600"
                                  />
                                  <span>{subtype}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Display selected medicines */}
      {formData.selectedMedicines.length > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Medicines</h4>
          <ul className="list-disc pl-5 space-y-1">
            {formData.selectedMedicines.map((medicine, idx) => (
              <li key={idx}>
                <span className="font-medium">{medicine.type} - {medicine.subtypeType}:</span> {medicine.subtypes.join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
  
  // Render IPR selection section
  const renderIPRSelection = (formData) => (
    <div className="space-y-4 mb-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select IPR Types and Subtypes
        </label>
        
        {/* IPR Type Selection */}
        <div className="mb-4 p-3 border border-gray-300 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">IPR Types</h4>
          <div className="flex flex-wrap gap-3">
            {iprData.map((ipr) => (
              <label key={ipr.type} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedIPRTypes.includes(ipr.type)}
                  onChange={() => handleIPRTypeChange(ipr.type)}
                  className="text-green-600"
                />
                <span>{ipr.type}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Subtype Selection */}
        {selectedIPRTypes.length > 0 && (
          <div className="p-3 border border-gray-300 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">IPR Subtypes</h4>
            <div className="space-y-3">
              {selectedIPRTypes.map(iprType => {
                const ipr = iprData.find(i => i.type === iprType);
                if (!ipr) return null;
                
                return (
                  <div key={iprType} className="ml-4">
                    <h5 className="font-medium text-gray-700 mb-1">{iprType}</h5>
                    <div className="flex flex-wrap gap-3">
                      {ipr.subtypes.map(subtype => {
                        const isSelected = formData.selectedIPRs.some(
                          item => item.type === iprType && item.subtypes.includes(subtype)
                        );
                        
                        return (
                          <label key={subtype} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleIPRSubtypeChange(iprType, subtype)}
                              className="text-green-600"
                            />
                            <span>{subtype}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Display selected IPRs */}
      {formData.selectedIPRs.length > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected IPRs</h4>
          <ul className="list-disc pl-5 space-y-1">
            {formData.selectedIPRs.map((ipr, idx) => (
              <li key={idx}>
                <span className="font-medium">{ipr.type}:</span> {ipr.subtypes.join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file size (5MB max)
    const validFiles = selectedFiles.filter(file => file.size <= 5 * 1024 * 1024);
    
    if (validFiles.length !== selectedFiles.length) {
      alert('Some files were too large (max 5MB each)');
    }
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleRemoveImage = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      // First upload files if any
      const uploadedImages = [];
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(file => {
          formData.append('images', file);
        });

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload images');
        }

        const uploadData = await uploadResponse.json();
        uploadedImages.push(...uploadData.urls);
      }

      // Format the offence location
      const offenceLocation = formData.offenceState 
        ? `${formData.offenceState}, ${formData.countryOfSeizure}`
        : formData.countryOfSeizure;

      // Then submit the form data with image references and persons data
      const submissionData = {
        ...formData,
        commodities,
        persons, // Add persons array to submission data
        images: uploadedImages,
        offenceLocation // Add formatted offence location
      };

      const response = await fetch('/api/seizures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit seizure');
      }

      // Handle successful submission
      router.push('/success');
    } catch (error) {
      console.error('Submission error:', error);
      alert(error.message);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Render commodity section for each commodity
  const renderCommoditySection = (commodity, index) => {
    const goodsTypes = [
      'Beverages', 
      'Medicine & Pharmaceuticals',
      'Intellectual Property Rights',
      'Restricted/Prohibited',
      'Fabrics',
      'Tiles',
      'Steel Doors',
      'Pipes',
      'Fuel(PMS)',
      'Animal skin/By products',
      'Used vehicles',
      'Arms and Ammunition',
      'Stock fish',
      'Empty container',
      'Frozen food',
      'Household Effect',
      'Abandoned Seizure',
      'Supermarket Items',
      'Others',
    ];

    const units = [
      'kilogram', 'gram', 'litre', 'piece', 'package', 'Bales', 
      'Bus', 'Lorry', 'Cartons', 'Tins', 'Jerrycan', 'Drums', 'Cartridges', 
      'Bags', 'Pieces', 'Rolls', 'Sacks', 'Blocks', 'container','Vehicle'
    ];

    return (
      <div key={index} className="border border-gray-300 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-gray-800">Commodity {index + 1}</h3>
          {commodities.length > 1 && (
            <button
              type="button"
              onClick={() => removeCommodity(index)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remove
            </button>
          )}
        </div>

        {/* Goods Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Goods Type</label>
          <select
            value={commodity.goodsType}
            onChange={(e) => handleCommodityChange(index, 'goodsType', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">Select goods type</option>
            {goodsTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Item Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Description</label>
          <textarea
            value={commodity.itemDescription}
            onChange={(e) => handleCommodityChange(index, 'itemDescription', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={2}
            placeholder="Describe the item in detail"
          />
        </div>

        {/* Quantity and Unit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              value={commodity.quantity}
              onChange={(e) => handleCommodityChange(index, 'quantity', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select
              value={commodity.unit}
              onChange={(e) => handleCommodityChange(index, 'unit', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select unit</option>
              {units.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Container/Bus/Lorry Number (conditional) */}
        {['container', 'Bus', 'Lorry','Vehicle'].includes(commodity.unit) && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {commodity.unit === 'container' ? 'Container Number' : 
               commodity.unit === 'Bus' ? ' Chasis Number' : 'Chasis Number'}
            </label>
            <input
              type="text"
              value={commodity.containerNumber}
              onChange={(e) => handleCommodityChange(index, 'containerNumber', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder={`Enter ${commodity.unit} number`}
              required
            />
          </div>
        )}
      </div>
    );
  };

  // Render person section for each person
  const renderPersonSection = (person, index) => {
    const roles = [
      'Driver',
      'Passenger',
      'Owner',
      'Consignee',
      'Consignor',
      'Broker',
      'Agent',
      'Suspect',
      'Witness',
      'Other'
    ];

    return (
      <div key={index} className="border border-gray-300 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-gray-800">Person {index + 1}</h3>
          {persons.length > 1 && (
            <button
              type="button"
              onClick={() => removePerson(index)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remove
            </button>
          )}
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={person.name}
            onChange={(e) => handlePersonChange(index, 'name', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Enter full name"
          />
        </div>

        {/* Role */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={person.role}
            onChange={(e) => handlePersonChange(index, 'role', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select role</option>
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        {/* Gender, Age, Nationality */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              value={person.gender}
              onChange={(e) => handlePersonChange(index, 'gender', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              value={person.age}
              onChange={(e) => handlePersonChange(index, 'age', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              min="0"
              max="120"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
            <select
              value={person.nationality}
              onChange={(e) => handlePersonChange(index, 'nationality', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select nationality</option>
              {countries.map(country => (
                <option key={country.iso2} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };

  // Render country and state dropdowns
  const renderLocationDropdowns = (prefix, showPort = false) => {
    const countryValue = formData[`${prefix}Country`];
    const stateValue = formData[`${prefix}State`];
    const states = countryValue ? getStatesForCountry(countryValue) : [];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {prefix === 'countryOfSeizure' ? 'Country of Seizure' : 'Country'}
          </label>
          <select
            name={`${prefix}Country`}
            value={countryValue}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required={prefix === 'countryOfSeizure'}
          >
            <option value="">Select country</option>
            {countries.map(country => (
              <option key={country.iso2} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        
        {countryValue && states.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {prefix === 'countryOfSeizure' ? 'State/Region' : 'State/Region'}
            </label>
            <select
              name={`${prefix}State`}
              value={stateValue}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required={prefix === 'countryOfSeizure'}
            >
              <option value="">Select state/region</option>
              {states.map(state => (
                <option key={state.code} value={state.name}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {prefix !== 'countryOfSeizure' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name={`${prefix}Location`}
                value={formData[`${prefix}Location`]}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder={prefix === 'departure' ? "e.g., Shanghai" : "e.g., Lagos"}
              />
            </div>
            
            {showPort && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {prefix === 'departure' ? 'Seaport/Airport Code' : 'Seaport/Airport Code'}
                </label>
                <input
                  type="text"
                  name={`${prefix}PortCode`}
                  value={formData[`${prefix}PortCode`]}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g., LOS for Lagos"
                />
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  if (loadingCountries) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
          CENcomm Seizure Form - CEN/STP4/APP/001
        </h1>
        <div className="text-center py-10">
          <p>Loading countries data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
          CENcomm Seizure Form - CEN/STP4/APP/001
        </h1>
        <div className="text-center py-10 text-red-500">
          <p>Error loading countries: {error}</p>
          <p>Using limited country list</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
        CENcomm Seizure Form - CEN/STP4/APP/001
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION A: CASE REFERENCE */}
        <section className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4 text-green-700">A. FOR SEIZURE REPORTING (ALL FIELDS ARE MANDATORY)</h2>
          
          {renderLocationDropdowns('countryOfSeizure')}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Offence Location Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Offence Location Type</label>
              <select
                name="offenceLocationType"
                value={formData.offenceLocationType}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select location type</option>
                <option value="airport">Airport</option>
                <option value="border">Border</option>
                <option value="ftz">FTZ</option>
                <option value="express courier">Express Courier</option>
                <option value="high seas">High Seas</option>
                <option value="inland">Inland</option>
                <option value="land boundary">Land Boundary</option>
                <option value="seaport">Seaport</option>
                <option value="mail centre">Mail Centre</option>
              </select>
            </div>
            
            {/* Offence Date & Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Offence Date & Time</label>
              <DatePicker
                selected={formData.offenceDateTime}
                onChange={(date) => setFormData({...formData, offenceDateTime: date})}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            {/* Service */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
              <select
                name="service"
                value={formData.service}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select service</option>
                <option value="Customs">Customs</option>
                <option value="Army">Army</option>
                <option value="Police">Police</option>
                <option value="EFCC">EFCC</option>
                <option value="NESREA">NESREA</option>
                <option value="NFIU">NFIU</option>
                <option value="NAFDAC">NAFDAC</option>
                <option value="IMMIGRATION">IMMIGRATION</option>
                <option value=" NSCDC"> NSCDC</option>
                <option value=" NAVY"> NAVY</option>
              </select>
            </div>
            
            {/* Direction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
              <select
                name="direction"
                value={formData.direction}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select direction</option>
                <option value="export">Export</option>
                <option value="import">Import</option>
                <option value="internal">Internal</option>
              </select>
            </div>
          </div>
        </section>

        {/* SECTION B: COMMODITY */}
        <section className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4 text-green-700">B. COMMODITY DETAILS</h2>
          
          {/* Common commodity properties (applied to all commodities) */}
          <div className="mb-6 p-4 border border-gray-300 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-4">Common Properties (Applied to All Commodities)</h3>
            
            {/* Counterfeit */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Counterfeit</label>
              <div className="flex space-x-4">
                {['yes', 'no', 'other'].map(option => (
                  <label key={option} className="inline-flex items-center">
                    <input
                      type="radio"
                      name="isCounterfeit"
                      checked={formData.isCounterfeit === option}
                      onChange={() => setFormData({...formData, isCounterfeit: option})}
                      className="text-green-600"
                    />
                    <span className="ml-2">{option.charAt(0).toUpperCase() + option.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Right Holder */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Right Holder/Brand</label>
              <input
                type="text"
                name="rightHolder"
                value={formData.rightHolder}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            {/* Concealment */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Concealment Method</label>
              <input
                type="text"
                name="concealment"
                value={formData.concealment}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g., baggage, false bottom, etc."
              />
            </div>
            
            {/* Illicit Trade */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Illicit Trade Indicators (Select all that apply)</label>
              <div className="space-y-2">
                {[
                  'Absence of documentation (licenses & authorization)',
                  'Expired documentation',
                  'Inappropriate transportation',
                  'Not declared',
                  'Smuggled'
                ].map(option => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      name="illicitTrade"
                      checked={formData.illicitTrade.includes(option)}
                      onChange={handleArrayChange}
                      value={option}
                      className="text-green-600"
                    />
                    <span className="ml-2">{option}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* IPR Fields (conditional) - Only show if any commodity is IPR type */}
            {commodities.some(c => c.goodsType === 'Intellectual Property Rights') && renderIPRSelection(formData)}
            
            {/* Medicine Fields (conditional) - Only show if any commodity is Medicine type */}
            {commodities.some(c => c.goodsType === 'Medicine & Pharmaceuticals') && renderMedicineSelection(formData)}
          </div>
          
          {/* Individual commodities */}
          {commodities.map((commodity, index) => (
            renderCommoditySection(commodity, index)
          ))}
          
          {/* Add Commodity Button */}
          <button
            type="button"
            onClick={addCommodity}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mb-4"
          >
            + Add Another Commodity
          </button>
          
          {/* Offence Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Offence Description</label>
            <textarea
              name="offenceDescription"
              value={formData.offenceDescription}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Describe the offence in detail"
            />
          </div>
        </section>

        {/* SECTION C: DETECTION */}
        <section className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4 text-green-700">C. DETECTION</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Detection Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Detection Method</label>
              <select
                name="detectionMethod"
                value={formData.detectionMethod}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select detection method</option>
                <option value="intelligence">Intelligence</option>
                <option value="risk profiling">Risk Profiling</option>
                <option value="investigation">Investigation</option>
                <option value="random selection">Random Selection</option>
                <option value="routine check">Routine Check</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            {/* Technical Aid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Technical Aid</label>
              <input
                type="text"
                name="technicalAid"
                value={formData.technicalAid}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Specify technical aid used"
              />
            </div>

            {/* Checkpoint */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Checkpoint</label>
              <select
                name="checkpoint"
                value={formData.checkpoint}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select checkpoint</option>
                {loadingCheckpoints ? (
                  <option value="">Loading checkpoints...</option>
                ) : (
                  checkpoints.map(checkpoint => (
                    <option key={checkpoint._id} value={checkpoint._id}>
                      {checkpoint.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Warehouse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
              <select
                name="warehouse"
                value={formData.warehouse}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select warehouse</option>
                {loadingWarehouses ? (
                  <option value="">Loading warehouses...</option>
                ) : (
                  warehouses.map(warehouse => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </section>

        {/* SECTION D: CONVEYANCE */}
        <section className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4 text-green-700">D. CONVEYANCE</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conveyance Type</label>
              <select
                name="conveyanceType"
                value={formData.conveyanceType}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select conveyance type</option>
                <option value="air">Air</option>
                <option value="express courier">Express Courier</option>
                <option value="vehicle">Vehicle</option>
                <option value="vessel">Vessel</option>
                <option value="pedestrian">Pedestrian</option>
                <option value="container">Container</option>
                <option value="truck">Truck</option>
                <option value="bus">Bus</option>
                <option value="lorry">Lorry</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Conveyance Number Field (conditional) */}
            {['vehicle', 'container', 'bus', 'lorry', 'vessel', 'truck'].includes(formData.conveyanceType) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.conveyanceType === 'vehicle' ? 'Vehicle Number' : 
                   formData.conveyanceType === 'container' ? 'Container Number' : 
                   formData.conveyanceType === 'bus' ? 'Bus Number' : 
                   formData.conveyanceType === 'lorry' ? 'Lorry Number' : 
                   formData.conveyanceType === 'vessel' ? 'Vessel Number' : 
                   formData.conveyanceType === 'truck' ? 'Truck Number' : 'Number'}
                </label>
                <input
                  type="text"
                  name="conveyanceNumber"
                  value={formData.conveyanceNumber}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder={`Enter ${formData.conveyanceType} number`}
                  required
                />
              </div>
            )}
          </div>
        </section>

        {/* SECTION E: ROUTE */}
       {/* SECTION E: ROUTE */}
<section className="border-b pb-6">
  <h2 className="text-xl font-semibold mb-4 text-green-700">E. ROUTE</h2>
  
  <div className="space-y-6">
    {/* Departure */}
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-medium text-gray-800 mb-3">a. DEPARTURE</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <select
            name="departureCountry"
            value={formData.departureCountry}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select country</option>
            {countries.map(country => (
              <option key={country.iso2} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        
        {formData.departureCountry && getStatesForCountry(formData.departureCountry).length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State/Region</label>
            <select
              name="departureState"
              value={formData.departureState}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select state/region</option>
              {getStatesForCountry(formData.departureCountry).map(state => (
                <option key={state.code} value={state.name}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            name="departureLocation"
            value={formData.departureLocation}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="e.g., Shanghai"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seaport/Airport Code</label>
            <input
              type="text"
              name="departurePortCode"
              value={formData.departurePortCode}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="e.g., LOS for Lagos"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Importer/Exporter TIN</label>
            <input
              type="text"
              name="departureTin"
              value={formData.departureTin}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Enter TIN number"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Transport</label>
        <select
          name="departureTransport"
          value={formData.departureTransport}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="">Select transport</option>
          <option value="air">Air</option>
          <option value="sea">Sea</option>
          <option value="land">Land</option>
          <option value="courier">Courier</option>
        </select>
      </div>
    </div>
    
    {/* Destination */}
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-medium text-gray-800 mb-3">b. DESTINATION</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <select
            name="destinationCountry"
            value={formData.destinationCountry}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select country</option>
            {countries.map(country => (
              <option key={country.iso2} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
        
        {formData.destinationCountry && getStatesForCountry(formData.destinationCountry).length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State/Region</label>
            <select
              name="destinationState"
              value={formData.destinationState}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select state/region</option>
              {getStatesForCountry(formData.destinationCountry).map(state => (
                <option key={state.code} value={state.name}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            name="destinationLocation"
            value={formData.destinationLocation}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="e.g., Lagos"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Seaport/Airport Code</label>
            <input
              type="text"
              name="destinationPortCode"
              value={formData.destinationPortCode}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="e.g., LOS for Lagos"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Importer/Exporter TIN</label>
            <input
              type="text"
              name="destinationTin"
              value={formData.destinationTin}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Enter TIN number"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Transport</label>
        <select
          name="destinationTransport"
          value={formData.destinationTransport}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="">Select transport</option>
          <option value="air">Air</option>
          <option value="sea">Sea</option>
          <option value="land">Land</option>
          <option value="courier">Courier</option>
        </select>
      </div>
    </div>
  </div>
</section>

        {/* SECTION F: PERSON - Updated to support multiple persons */}
        <section className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4 text-green-700">F. PERSON</h2>
          
          {/* Individual persons */}
          {persons.map((person, index) => (
            renderPersonSection(person, index)
          ))}
          
          {/* Add Person Button */}
          <button
            type="button"
            onClick={addPerson}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mb-4"
          >
            + Add Another Person
          </button>
        </section>

        {/* SECTION G: PICTURES */}
        <section className="pb-6">
          <h2 className="text-xl font-semibold mb-4 text-green-700">G. PICTURES</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <label className="flex flex-col items-center justify-center cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-4 text-gray-500"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, JPEG (MAX. 5MB each)
                </p>
              </div>
            </label>

            {isUploading && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )}

            {files.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {files.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index}`}
                      className="h-32 w-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/seizures')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUploading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {isUploading ? 'Submitting...' : 'Submit Seizure Report'}
          </button>
        </div>
      </form>
    </div>
  );
}