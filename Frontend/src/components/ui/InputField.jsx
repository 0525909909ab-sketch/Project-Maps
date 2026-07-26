import React from "react"

const InputField = ({ id, label, type = "text", placeholder, register, validation, error, errorMessage }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-colors ${
          error ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
        }`}
        {...register(id, validation)}
      />
      {error && <p className="text-red-500 text-xs mt-1">{errorMessage}</p>}
    </div>
  )
}

export default InputField
